export type SpikeIQVideo = {
  id: string
  playerId: string
  sessionId: string
  fileName: string
  mimeType: string
  size: number
  createdAt: string
  blob: Blob
}

export type VideoSummary = Omit<SpikeIQVideo, 'blob'>
