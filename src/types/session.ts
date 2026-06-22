export type SessionStatus = 'pending' | 'analyzing' | 'analyzed' | 'failed'
export type SessionType = 'single' | 'stamina' | 'gameplay'
export type StaminaAttemptStatus = 'pending' | 'recorded' | 'analyzing' | 'analyzed' | 'failed' | 'skipped'

export type SpikeAnalysis = {
  spikeCount: number
  estimatedSpikeHeightCm: number
  directionAccuracy: number
  approachAngle: number
  contactConsistency: number
  framesAnalyzed: number
  motionScore: number
  confidence: number
  summary: string
  trainingFocus: string[]
}

export type Session = {
  id: string
  playerId: string
  videoId?: string
  fileName?: string
  status: SessionStatus
  title: string
  createdAt: string
  updatedAt: string
  sessionType?: SessionType
  staminaConfig?: {
    targetAttempts: number
    restSeconds: number
  }
  staminaAttempts?: StaminaAttempt[]
  analysisError?: string
  analysis?: SpikeAnalysis | null
}

export type StaminaAttempt = {
  index: number
  videoId?: string
  fileName?: string
  status: StaminaAttemptStatus
  isMaxEffort?: boolean
  analysis?: SpikeAnalysis | null
  analysisError?: string
  recordedAt?: string
}

export type SessionDraft = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>
