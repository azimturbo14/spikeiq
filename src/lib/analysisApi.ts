import type { SpikeAnalysis } from '@/types/session'

const API_URL = import.meta.env.VITE_ANALYSIS_API_URL ?? 'http://localhost:5001'
export const BACKEND_ANALYSIS_ENABLED = false

export type AnalysisJobStatus = 'queued' | 'analyzing' | 'analyzed' | 'failed'

export type AnalysisJob = {
  id: string
  sessionId: string
  playerId: string
  fileName: string
  status: AnalysisJobStatus
  createdAt: string
  updatedAt: string
  result: SpikeAnalysis | null
  error: string | null
}

type AnalysisUploadInput = {
  sessionId: string
  playerId: string
  fileName: string
  blob: Blob
}

export async function queueBackendAnalysisIfEnabled(input: AnalysisUploadInput) {
  if (!BACKEND_ANALYSIS_ENABLED) {
    return {
      enabled: false,
      reason: 'Backend analysis API is inactive/experimental. SpikeIQ is using local heuristic estimates only.',
    }
  }

  const job = await uploadVideoForAnalysis(input)
  return { enabled: true, job }
}

export async function uploadVideoForAnalysis(input: AnalysisUploadInput) {
  const formData = new FormData()
  formData.append('video', input.blob, input.fileName)
  formData.append('sessionId', input.sessionId)
  formData.append('playerId', input.playerId)
  formData.append('fileName', input.fileName)

  const response = await fetch(`${API_URL}/api/analysis/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Unable to send video to analysis backend.')
  }

  return (await response.json()) as { job: AnalysisJob }
}

export async function getAnalysisStatus(sessionId: string) {
  const response = await fetch(`${API_URL}/api/analysis/${encodeURIComponent(sessionId)}/status`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Unable to load analysis status.')
  }

  return (await response.json()) as { job: AnalysisJob }
}
