import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/db/spikeiqDb'
import type { Session, SessionDraft, SpikeAnalysis, StaminaAttempt } from '@/types/session'

export function useSessions(playerId?: string | null) {
  const sessions = useLiveQuery<Session[]>(
    () => {
      if (!playerId) return Promise.resolve([] as Session[])
      return db.sessions.where('playerId').equals(playerId).sortBy('createdAt')
    },
    [playerId],
  )

  return sessions ?? []
}

export async function createSession(draft: SessionDraft): Promise<Session> {
  const now = new Date().toISOString()
  const session: Session = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  await db.sessions.put(session)
  return session
}

export async function createStaminaSession({ playerId, targetAttempts = 10, restSeconds = 30 }: { playerId: string; targetAttempts?: number; restSeconds?: number }) {
  const now = new Date().toISOString()
  const session: Session = {
    id: crypto.randomUUID(),
    playerId,
    status: 'pending',
    title: `${targetAttempts}-spike stamina session`,
    createdAt: now,
    updatedAt: now,
    sessionType: 'stamina',
    staminaConfig: {
      targetAttempts,
      restSeconds,
    },
    staminaAttempts: Array.from({ length: targetAttempts }, (_, index) => ({
      index,
      status: 'pending',
    })),
  }

  await db.sessions.put(session)
  return session
}

export async function updateStaminaAttempt(sessionId: string, attemptIndex: number, patch: Partial<StaminaAttempt>) {
  const session = await db.sessions.get(sessionId)
  if (!session?.staminaAttempts) return

  const attempts = [...session.staminaAttempts]
  const current = attempts[attemptIndex]
  if (!current) return

  const nextStatus = patch.status ?? current.status
  const status = nextStatus === 'analyzed' && patch.analysis ? 'analyzed' : nextStatus
  attempts[attemptIndex] = {
    ...current,
    ...patch,
    status,
  }

  await db.sessions.update(sessionId, {
    staminaAttempts: attempts,
    status: attempts.some((attempt) => attempt.status === 'pending') ? session.status : 'analyzed',
    updatedAt: new Date().toISOString(),
  })
}

export async function updateSessionStatus(sessionId: string, status: Session['status'], analysisError?: string, analysis?: SpikeAnalysis | null) {
  const session = await db.sessions.get(sessionId)
  if (!session) return

  await db.sessions.update(sessionId, {
    status,
    analysisError,
    analysis,
    updatedAt: new Date().toISOString(),
  })
}

export async function updateSessionVideo(sessionId: string, videoId: string, fileName: string) {
  const session = await db.sessions.get(sessionId)
  if (!session) return

  await db.sessions.update(sessionId, {
    videoId,
    fileName,
    updatedAt: new Date().toISOString(),
  })
}
