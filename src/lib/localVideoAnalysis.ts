import type { SpikeAnalysis } from '@/types/session'

type FrameSample = {
  data: Uint8ClampedArray
}

export async function analyzeLocalVideo(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)

  try {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = url

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('The browser could not read this video file.'))
    })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      throw new Error('Canvas analysis is not available in this browser.')
    }

    canvas.width = 160
    canvas.height = 90

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(video.duration, 12) : 0
    const frameCount = Math.max(8, Math.min(36, Math.floor(duration * 2)))
    const frames: FrameSample[] = []

    for (let index = 0; index < frameCount; index += 1) {
      const time = frameCount <= 1 ? 0 : (index / (frameCount - 1)) * duration
      await seekVideo(video, time)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      frames.push({ data: imageData.data })
    }

    if (frames.length < 2) {
      throw new Error('The video was too short to analyse.')
    }

    return {
      fileName,
      analysis: analyseFrames(frames),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('The browser could not seek this video for analysis.'))
    }
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.currentTime = time
  })
}

function analyseFrames(frames: FrameSample[]) {
  const diffs = []

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1].data
    const current = frames[index].data
    const length = Math.min(previous.length, current.length)
    let diff = 0
    let moving = 0
    let weightedX = 0
    let weightedY = 0
    const frameWidth = 160

    for (let pixel = 0; pixel < length; pixel += 4) {
      const previousLuma = luma(previous[pixel], previous[pixel + 1], previous[pixel + 2])
      const currentLuma = luma(current[pixel], current[pixel + 1], current[pixel + 2])
      const delta = Math.abs(currentLuma - previousLuma)

      if (delta > 24) {
        moving += 1
        const x = (pixel / 4) % frameWidth
        const y = Math.floor((pixel / 4) / frameWidth)
        weightedX += x * delta
        weightedY += y * delta
      }

      diff += delta
    }

    const movingRatio = moving / Math.max(length / 4, 1)
    const centroidX = weightedX / Math.max(diff, 1)
    const centroidY = weightedY / Math.max(diff, 1)
    diffs.push({
      diff: diff / Math.max(length / 4, 1),
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

function buildSummary(metrics: Pick<SpikeAnalysis, 'spikeCount' | 'directionAccuracy' | 'approachAngle' | 'contactConsistency' | 'motionScore'>) {
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

function buildTrainingFocus(metrics: Pick<SpikeAnalysis, 'directionAccuracy' | 'approachAngle' | 'contactConsistency' | 'motionScore'>) {
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

function luma(r: number, g: number, b: number) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722
}

function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function std(values: number[]) {
  if (values.length === 0) return 0
  const average = mean(values)
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)))
}

function consistency(values: number[]) {
  if (values.length < 2) return 0
  const deltas = []
  for (let index = 1; index < values.length; index += 1) {
    deltas.push(values[index] - values[index - 1])
  }
  const average = mean(deltas.map(Math.abs))
  const deviation = std(deltas.map(Math.abs))
  return clamp(1 - deviation / Math.max(average + deviation, 1), 0, 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
