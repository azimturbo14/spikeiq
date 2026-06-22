import cors from 'cors'
import express from 'express'
import { mkdir, readFile, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { FFmpeg } from '@ffmpeg/ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const port = Number(process.env.PORT ?? 5001)
const uploadDir = path.join(__dirname, 'uploads')
const jobs = new Map()

await mkdir(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await mkdir(uploadDir, { recursive: true })
      callback(null, uploadDir)
    } catch (error) {
      callback(error)
    }
  },
  filename: (_request, file, callback) => {
    const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, '_')
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('video/')) {
      callback(new Error('Only video files are supported.'))
      return
    }
    callback(null, true)
  },
})

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'spikeiq-analysis-api', jobs: jobs.size })
})

app.post('/api/analysis/upload', upload.single('video'), async (request, response) => {
  try {
    const { sessionId, playerId, fileName } = request.body

    if (!request.file) {
      response.status(400).json({ error: 'Video file is required.' })
      return
    }

    if (!sessionId || !playerId) {
      response.status(400).json({ error: 'sessionId and playerId are required.' })
      return
    }

    const jobId = String(sessionId)
    const job = {
      id: jobId,
      sessionId: jobId,
      playerId: String(playerId),
      fileName: String(fileName || request.file.originalname),
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      videoPath: request.file.path,
      result: null,
      error: null,
    }

    jobs.set(jobId, job)
    response.json({ ok: true, job: publicJob(job) })

    void runAnalysis(jobId).catch(async (error) => {
      const failedJob = jobs.get(jobId)
      if (!failedJob) return
      failedJob.status = 'failed'
      failedJob.error = error instanceof Error ? error.message : 'Analysis failed.'
      failedJob.updatedAt = new Date().toISOString()
    })
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to start analysis.' })
  }
})

app.get('/api/analysis/:sessionId/status', (request, response) => {
  const job = jobs.get(String(request.params.sessionId))
  if (!job) {
    response.status(404).json({ error: 'Analysis job not found.' })
    return
  }
  response.json({ job: publicJob(job) })
})

app.listen(port, () => {
  console.log(`SpikeIQ analysis API listening on http://localhost:${port}`)
})

async function runAnalysis(jobId) {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = 'analyzing'
  job.updatedAt = new Date().toISOString()

  const ffmpeg = new FFmpeg()
  ffmpeg.on('log', ({ message }) => {
    if (message.includes('frame=') || message.includes('speed=')) {
      console.log(`[${jobId}] ${message}`)
    }
  })

  await ffmpeg.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm',
  })

  const inputName = 'input-video'
  await ffmpeg.writeFile(inputName, await readFile(job.videoPath))

  await ffmpeg.exec([
    '-y',
    '-i',
    inputName,
    '-t',
    '12',
    '-vf',
    'fps=2,scale=160:90,format=gray',
    '-frames:v',
    '36',
    'frame%03d.raw',
  ])

  const files = await ffmpeg.listDir('.')
  const frameFiles = files
    .filter((file) => file.name.endsWith('.raw'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => file.name)

  if (frameFiles.length === 0) {
    throw new Error('No video frames could be extracted for analysis.')
  }

  const frames = []
  for (const frameFile of frameFiles) {
    const buffer = await ffmpeg.readFile(frameFile)
    frames.push(Buffer.from(buffer))
  }

  const result = analyseFrames(frames)
  job.result = result
  job.status = 'analyzed'
  job.updatedAt = new Date().toISOString()

  await rename(job.videoPath, path.join(uploadDir, `${jobId}-${path.basename(job.videoPath)}`)).catch(() => undefined)
}

function analyseFrames(frames) {
  const diffs = []

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1]
    const current = frames[index]
    const length = Math.min(previous.length, current.length)
    let diff = 0
    let moving = 0
    let weightedX = 0
    let weightedY = 0
    const frameWidth = 160

    for (let pixel = 0; pixel < length; pixel += 1) {
      const delta = Math.abs(current[pixel] - previous[pixel])
      if (delta > 24) {
        moving += 1
        const x = pixel % frameWidth
        const y = Math.floor(pixel / frameWidth)
        weightedX += x * delta
        weightedY += y * delta
      }
      diff += delta
    }

    const movingRatio = moving / Math.max(length, 1)
    const centroidX = weightedX / Math.max(diff, 1)
    const centroidY = weightedY / Math.max(diff, 1)
    diffs.push({
      diff: diff / Math.max(length, 1),
      movingRatio,
      centroidX,
      centroidY,
    })
  }

  const averageDiff = mean(diffs.map((item) => item.diff))
  const standardDeviation = std(diffs.map((item) => item.diff))
  const peakThreshold = Math.max(18, averageDiff + standardDeviation * 0.85)
  const peaks = diffs.filter((item) => item.diff >= peakThreshold)
  const motionScore = clamp(averageDiff / 38, 0, 1)
  const spikeCount = clamp(Math.max(1, Math.round(peaks.length + motionScore * 2)), 1, 9)
  const horizontalConsistency = consistency(diffs.map((item) => item.centroidX))
  const verticalConsistency = consistency(diffs.map((item) => item.centroidY))
  const directionAccuracy = Math.round(clamp(48 + horizontalConsistency * 34 + verticalConsistency * 12 + motionScore * 8, 35, 96))
  const contactConsistency = Math.round(clamp(42 + peaks.length * 7 + verticalConsistency * 28 + motionScore * 16, 35, 96))
  const approachAngle = Math.round(clamp(58 + (verticalConsistency - horizontalConsistency) * 22 + motionScore * 10, 35, 88))
  const estimatedSpikeHeightCm = Math.round(clamp(245 + approachAngle * 0.72 + motionScore * 38 + verticalConsistency * 28, 235, 330))

  return {
    spikeCount,
    estimatedSpikeHeightCm,
    directionAccuracy,
    approachAngle,
    contactConsistency,
    framesAnalyzed: frames.length,
    motionScore: Math.round(motionScore * 100),
    confidence: Math.round(clamp(45 + frames.length * 1.1 + motionScore * 28 + peaks.length * 3, 45, 92)),
    summary: buildSummary({ spikeCount, directionAccuracy, approachAngle, contactConsistency, motionScore }),
    trainingFocus: buildTrainingFocus({ directionAccuracy, approachAngle, contactConsistency, motionScore }),
  }
}

function buildSummary(metrics) {
  const parts = [
    `${metrics.spikeCount} spike attempt${metrics.spikeCount === 1 ? '' : 's'} detected in the sampled clip.`,
    `Direction accuracy estimate: ${metrics.directionAccuracy}%.`,
    `Contact consistency estimate: ${metrics.contactConsistency}%.`,
  ]

  if (metrics.approachAngle >= 72) {
    parts.push('The movement pattern suggests a strong vertical approach.')
  } else if (metrics.approachAngle < 55) {
    parts.push('The movement pattern suggests a flatter approach that may reduce contact control.')
  } else {
    parts.push('The approach pattern looks balanced across the sampled frames.')
  }

  return parts.join(' ')
}

function buildTrainingFocus(metrics) {
  const focus = []

  if (metrics.directionAccuracy < 68) {
    focus.push('Target-zone swing control: hit to zones 1, 5, and deep middle from a consistent approach.')
  }

  if (metrics.contactConsistency < 70) {
    focus.push('Contact timing: 3-step approach reps with a focus on stable plant and high contact point.')
  }

  if (metrics.approachAngle < 58) {
    focus.push('Vertical conversion: box jumps into spike approaches to turn horizontal speed upward.')
  }

  if (focus.length === 0) {
    focus.push('Maintain current approach rhythm and add zone-calling reps to sharpen directional control.')
  }

  return focus
}

function publicJob(job) {
  return {
    id: job.id,
    sessionId: job.sessionId,
    playerId: job.playerId,
    fileName: job.fileName,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    result: job.result,
    error: job.error,
  }
}

function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function std(values) {
  if (values.length === 0) return 0
  const average = mean(values)
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)))
}

function consistency(values) {
  if (values.length < 2) return 0
  const deltas = []
  for (let index = 1; index < values.length; index += 1) {
    deltas.push(values[index] - values[index - 1])
  }
  const average = mean(deltas.map(Math.abs))
  const deviation = std(deltas.map(Math.abs))
  return clamp(1 - deviation / Math.max(average + deviation, 1), 0, 1)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
