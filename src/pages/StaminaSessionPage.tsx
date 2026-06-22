import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, FileVideo, Play, RotateCcw, UploadCloud, UsersRound, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { AttemptProgressStrip } from '@/components/stamina/AttemptProgressStrip'
import { RestCountdown } from '@/components/stamina/RestCountdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createStaminaSession, updateStaminaAttempt } from '@/hooks/useSessions'
import { saveVideo } from '@/hooks/useVideos'
import { BACKEND_ANALYSIS_ENABLED, queueBackendAnalysisIfEnabled } from '@/lib/analysisApi'
import { analyzeLocalVideo } from '@/lib/localVideoAnalysis'
import { cn } from '@/lib/utils'
import { usePlayers } from '@/hooks/usePlayers'
import type { Player } from '@/types/player'
import type { StaminaAttemptStatus } from '@/types/session'

type WizardPhase =
  | { step: 'setup' }
  | { step: 'record'; attemptIndex: number }
  | { step: 'quality'; attemptIndex: number }
  | { step: 'rest'; attemptIndex: number }
  | { step: 'complete'; sessionId: string }

const restOptions = [20, 30, 45, 60]

export function StaminaSessionPage() {
  const navigate = useNavigate()
  const { players, selectedPlayerId } = usePlayers()
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const [phase, setPhase] = useState<WizardPhase>({ step: 'setup' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [restSeconds, setRestSeconds] = useState(30)
  const [attempts, setAttempts] = useState<Array<{ index: number; status: StaminaAttemptStatus; isMaxEffort?: boolean }>>(
    Array.from({ length: 10 }, (_, index) => ({ index, status: 'pending' })),
  )
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const analysisRunId = useRef(0)

  if (!selectedPlayer) {
    return <EmptyState title="Create a player first" description="Stamina sessions are scoped to one player so SpikeIQ can measure fatigue and consistency over time." />
  }

  const player = selectedPlayer
  const targetAttempts = 10

  async function startSession() {
    const session = await createStaminaSession({ playerId: player.id, targetAttempts, restSeconds })
    setSessionId(session.id)
    setAttempts(Array.from({ length: targetAttempts }, (_, index) => ({ index, status: 'pending' })))
    setPhase({ step: 'record', attemptIndex: 0 })
  }

  async function saveAttempt(file: File) {
    if (!sessionId) return
    const attemptIndex = phase.step === 'record' ? phase.attemptIndex : 0
    setIsSaving(true)
    analysisRunId.current += 1
    const runId = analysisRunId.current

    try {
      const video = await saveVideo({
        playerId: player.id,
        sessionId,
        fileName: file.name,
        mimeType: file.type || 'video/unknown',
        size: file.size,
        blob: file,
      })

      await updateStaminaAttempt(sessionId, attemptIndex, {
        videoId: video.id,
        fileName: file.name,
        status: 'recorded',
        recordedAt: new Date().toISOString(),
      })

      setAttempts((current) => current.map((attempt, index) => (index === attemptIndex ? { ...attempt, status: 'recorded' } : attempt)))
      setPendingFile(file)
      setPhase({ step: 'quality', attemptIndex })

      void analyzeLocalVideo(file, file.name)
        .then(({ analysis }) => {
          if (runId !== analysisRunId.current) return
          void updateStaminaAttempt(sessionId, attemptIndex, {
            status: 'analyzed',
            analysis,
            analysisError: undefined,
          }).then(() => {
            setAttempts((current) => current.map((attempt, index) => (index === attemptIndex ? { ...attempt, status: 'analyzed' } : attempt)))
          })
        })
        .catch((error) => {
          if (runId !== analysisRunId.current) return
          void updateStaminaAttempt(sessionId, attemptIndex, {
            status: 'failed',
            analysisError: error instanceof Error ? error.message : 'Unable to analyse this attempt.',
          }).then(() => {
            setAttempts((current) => current.map((attempt, index) => (index === attemptIndex ? { ...attempt, status: 'failed' } : attempt)))
          })
        })

      if (BACKEND_ANALYSIS_ENABLED) {
        queueBackendAnalysisIfEnabled({
          sessionId,
          playerId: player.id,
          fileName: file.name,
          blob: file,
        }).catch(() => undefined)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmMaxEffort(isMaxEffort: boolean) {
    if (!sessionId || phase.step !== 'quality') return
    await updateStaminaAttempt(sessionId, phase.attemptIndex, { isMaxEffort })
    setAttempts((current) => current.map((attempt, index) => (index === phase.attemptIndex ? { ...attempt, isMaxEffort } : attempt)))
    setPendingFile(null)

    if (phase.attemptIndex + 1 >= targetAttempts) {
      setPhase({ step: 'complete', sessionId })
      return
    }

    setPhase({ step: 'rest', attemptIndex: phase.attemptIndex + 1 })
  }

  function skipAttempt() {
    if (!sessionId || phase.step !== 'record') return
    void updateStaminaAttempt(sessionId, phase.attemptIndex, { status: 'skipped' })
    setAttempts((current) => current.map((attempt, index) => (index === phase.attemptIndex ? { ...attempt, status: 'skipped' } : attempt)))
    moveToNext(phase.attemptIndex)
  }

  function reRecordAttempt() {
    if (phase.step !== 'quality') return
    setPendingFile(null)
    setPhase({ step: 'record', attemptIndex: phase.attemptIndex })
  }

  function moveToNext(attemptIndex: number) {
    if (attemptIndex + 1 >= targetAttempts) {
      setPhase({ step: 'complete', sessionId: sessionId ?? '' })
      return
    }
    setPhase({ step: 'record', attemptIndex: attemptIndex + 1 })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Stamina Test</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Measure how your spike changes under fatigue.</h1>
        <p className="mt-3 max-w-2xl text-secondary">SpikeIQ guides you through ordered max-effort attempts and rest periods so it can compare early-session power with late-session decisions.</p>
      </div>

      <AnimatePresence mode="wait">
        {phase.step === 'setup' ? (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <SetupCard selectedPlayer={selectedPlayer} restSeconds={restSeconds} setRestSeconds={setRestSeconds} onStart={startSession} />
            <Card>
              <CardHeader>
                <CardTitle>Low-friction protocol</CardTitle>
                <p className="text-sm text-secondary">The app handles the order and rest timer. You only record/upload one spike at a time.</p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <ProtocolPill icon={<Zap className="h-4 w-4" />} label="10 attempts" description="Max-effort spikes in order." />
                <ProtocolPill icon={<Clock className="h-4 w-4" />} label="Rest timer" description="30 seconds by default." />
                <ProtocolPill icon={<UsersRound className="h-4 w-4" />} label="One player" description="Fatigue stays scoped to this athlete." />
              </CardContent>
            </Card>
          </motion.div>
        ) : phase.step === 'record' ? (
          <motion.div key="record" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <AttemptProgressStrip attempts={attempts} currentIndex={phase.attemptIndex} targetAttempts={targetAttempts} />
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Attempt {phase.attemptIndex + 1} of {targetAttempts}</CardTitle>
                    <p className="text-sm text-secondary">Record or upload one max-effort spike. Try to use the same set location as the previous attempts.</p>
                  </div>
                  <BadgeLike status={attempts[phase.attemptIndex]?.status ?? 'pending'} />
                </div>
              </CardHeader>
              <CardContent>
                <FileDropZone onFile={saveAttempt} disabled={isSaving} />
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" variant="muted" onClick={skipAttempt} disabled={isSaving}>
                    Skip attempt
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setPhase({ step: 'setup' })}>
                    Cancel session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : phase.step === 'quality' ? (
          <motion.div key="quality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <AttemptProgressStrip attempts={attempts} currentIndex={phase.attemptIndex} targetAttempts={targetAttempts} />
            <Card>
              <CardHeader>
                <CardTitle>Quick quality check</CardTitle>
                <p className="text-sm text-secondary">This keeps stamina data honest without making you fill out a long form.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {pendingFile ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">
                        <FileVideo className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{pendingFile.name}</p>
                        <p className="text-xs text-secondary">Attempt {phase.attemptIndex + 1} saved locally.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-spike/20 bg-spike/[0.06] p-4">
                  <p className="text-sm font-semibold text-primary">Was this a genuine max-effort spike?</p>
                  <p className="mt-1 text-sm leading-6 text-secondary">If not, SpikeIQ will still keep the attempt but can treat it as lower-confidence fatigue data.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => confirmMaxEffort(true)}>Yes, max effort</Button>
                  <Button type="button" variant="muted" onClick={() => confirmMaxEffort(false)}>No, not max effort</Button>
                  <Button type="button" variant="ghost" onClick={reRecordAttempt}>
                    <RotateCcw className="h-4 w-4" />
                    Re-record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : phase.step === 'rest' ? (
          <motion.div key="rest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <AttemptProgressStrip attempts={attempts} currentIndex={phase.attemptIndex} targetAttempts={targetAttempts} />
            <RestCountdown
              key={restSeconds}
              seconds={restSeconds}
              onComplete={() => moveToNext(phase.attemptIndex)}
              onSkip={() => moveToNext(phase.attemptIndex)}
              onAddTime={(extraSeconds) => setRestSeconds((value) => value + extraSeconds)}
            />
          </motion.div>
        ) : (
          <motion.div key="complete" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <AttemptProgressStrip attempts={attempts} targetAttempts={targetAttempts} />
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Stamina Test complete</CardTitle>
                    <p className="text-sm text-secondary">SpikeIQ saved {attempts.length} ordered attempts with rest-time context.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-secondary">Open the session report to review the saved attempts. Future versions will turn this into a fatigue curve, jump decay chart, and block-reading report.</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate(`/session/${phase.sessionId}`)}>View session report</Button>
                  <Button variant="muted" onClick={() => setPhase({ step: 'setup' })}>Start another session</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SetupCard({ selectedPlayer, restSeconds, setRestSeconds, onStart }: { selectedPlayer: Player; restSeconds: number; setRestSeconds: (value: number) => void; onStart: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Run a 10-spike stamina test</CardTitle>
        <p className="text-sm text-secondary">SpikeIQ will guide you through 10 max-effort spikes. Keep the same set location if possible and rest between attempts so fatigue can be measured.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-spike to-info font-black text-background">
              {selectedPlayer.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">{selectedPlayer.name}</p>
              <p className="text-xs text-secondary">All attempts will be scoped to this player.</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">Rest between attempts</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {restOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  'rounded-2xl border p-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-spike focus:ring-offset-2 focus:ring-offset-background',
                  restSeconds === option ? 'border-spike bg-spike/10 text-spike' : 'border-white/10 bg-white/[0.025] text-secondary hover:text-primary',
                )}
                onClick={() => setRestSeconds(option)}
              >
                {option}s
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          For the cleanest stamina data, make every attempt max effort and keep the set location consistent.
        </div>

        <Button className="w-full" onClick={onStart}>
          <Play className="h-4 w-4" />
          Start 10-spike test
        </Button>
      </CardContent>
    </Card>
  )
}

function FileDropZone({ onFile, disabled }: { onFile: (file: File) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File | undefined) {
    if (file) onFile(file)
  }

  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.025] p-10 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-spike focus:ring-offset-2 focus:ring-offset-background',
        dragging && 'border-spike bg-spike/[0.045]',
        disabled && 'opacity-60',
      )}
      onClick={() => document.querySelector<HTMLInputElement>('[data-stamina-file]')?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        handleFile(event.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          document.querySelector<HTMLInputElement>('[data-stamina-file]')?.click()
        }
      }}
    >
      <input
        type="file"
        accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
        className="sr-only"
        data-stamina-file
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-spike/10 text-spike shadow-glow">
        <UploadCloud className="h-8 w-8" />
      </div>
      <p className="text-lg font-semibold text-primary">Record/upload Attempt video</p>
      <p className="mt-2 text-sm text-secondary">Attach the clip for this attempt. SpikeIQ will keep the order automatically.</p>
      <Button type="button" variant="outline" size="sm" className="mt-5" disabled={disabled}>
        Choose video
      </Button>
    </div>
  )
}

function ProtocolPill({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-spike">{icon}{label}</div>
      <p className="text-sm text-secondary">{description}</p>
    </div>
  )
}

function BadgeLike({ status }: { status: StaminaAttemptStatus }) {
  const variantClass = status === 'analyzed' ? 'border-spike bg-spike/10 text-spike' : status === 'failed' ? 'border-danger bg-danger/10 text-danger' : status === 'skipped' ? 'border-warning bg-warning/10 text-warning' : status === 'recorded' || status === 'analyzing' ? 'border-info bg-info/10 text-info' : 'border-white/10 bg-white/[0.025] text-secondary'
  return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', variantClass)}>{status}</span>
}
