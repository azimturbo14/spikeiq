import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, FileVideo, UploadCloud, Volleyball } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createSession, updateSessionStatus, updateSessionVideo } from '@/hooks/useSessions'
import { analyzeLocalVideo } from '@/lib/localVideoAnalysis'
import { saveVideo } from '@/hooks/useVideos'
import { usePlayers } from '@/hooks/usePlayers'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/utils/format'
import { playerFormSchema, type PlayerFormValues } from '@/types/forms'

type UploadStep = {
  label: string
}

const uploadSteps: UploadStep[] = [
  { label: 'Creating player session' },
  { label: 'Saving video to SpikeIQ database' },
  { label: 'Running local heuristic analysis' },
]

export function UploadPage() {
  const navigate = useNavigate()
  const { players, selectedPlayerId, createPlayer } = usePlayers()
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [fileOwnerPlayerId, setFileOwnerPlayerId] = useState<string | null>(null)
  const activeFile = file && fileOwnerPlayerId === selectedPlayerId ? file : null
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: selectedPlayer?.name ?? '',
      position: selectedPlayer?.position ?? 'Outside hitter',
      dominantHand: selectedPlayer?.dominantHand ?? 'Right',
    },
  })

  async function submit(values: PlayerFormValues) {
    if (!activeFile) {
      setSaveError('Choose a video file before saving the session.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setActiveStep(0)

    try {
      const player = selectedPlayer ?? await createPlayer(values)
      const session = await createSession({
        playerId: player.id,
        title: activeFile.name,
        status: 'pending',
      })

      setActiveStep(1)
      const video = await saveVideo({
        playerId: player.id,
        sessionId: session.id,
        fileName: activeFile.name,
        mimeType: activeFile.type || 'video/unknown',
        size: activeFile.size,
        blob: activeFile,
      })

      await updateSessionVideo(session.id, video.id, activeFile.name)
      await updateSessionStatus(session.id, 'analyzing')
      setActiveStep(2)

      let analysisResult
      try {
        analysisResult = await analyzeLocalVideo(activeFile, activeFile.name)
        console.log('Analysis complete:', analysisResult.analysis)
        await updateSessionStatus(session.id, 'analyzed', undefined, analysisResult.analysis)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to analyse video in this browser.'
        console.error('Analysis failed:', message, error)
        setSaveError(message)
        await updateSessionStatus(session.id, 'pending', message)
      }
      navigate(`/session/${session.id}`)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save the video session.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Video upload</p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Save a real spike clip.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-secondary">SpikeIQ saves the video under the active player and runs local heuristic analysis in the browser. Metrics are estimates from sampled video frames, not verified biomechanical measurements.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Session intake</CardTitle>
          <p className="text-sm text-secondary">Create or confirm the player profile, attach the video, and run the local spike-clip analyser.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-6" data-spikeiq-form="upload">
            <div
              className={cn(
                'group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.025] p-10 text-center transition-colors hover:border-spike/50 hover:bg-spike/[0.045]',
                isDragging && 'border-spike bg-spike/[0.08]',
              )}
              onClick={() => document.querySelector<HTMLInputElement>('[data-spikeiq-field="file"]')?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                const selected = event.dataTransfer.files?.[0] ?? null
                if (selected) {
                  setFile(selected)
                  setFileOwnerPlayerId(selectedPlayerId)
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  document.querySelector<HTMLInputElement>('[data-spikeiq-field="file"]')?.click()
                }
              }}
            >
              <input
                type="file"
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
                className="sr-only"
                data-spikeiq-field="file"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setFileOwnerPlayerId(selectedPlayerId)
                }}
              />
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-spike/10 text-spike shadow-glow transition-transform group-hover:scale-105">
                <UploadCloud className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold text-primary">Drag and drop or click to browse</p>
              <p className="mt-2 text-sm text-secondary">Accept MP4, MOV, AVI</p>
              <Button type="button" variant="outline" size="sm" className="mt-5">
                Choose video
              </Button>
              {activeFile ? (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-spike/20 bg-spike/10 px-4 py-3 text-left">
                  <FileVideo className="h-5 w-5 text-spike" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{activeFile.name}</p>
                    <p className="text-xs text-secondary">{formatFileSize(activeFile.size)}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {selectedPlayer ? (
              <div className="rounded-2xl border border-spike/20 bg-spike/[0.06] p-4">
                <p className="text-sm font-semibold text-primary">Active player: {selectedPlayer.name}</p>
                <p className="mt-1 text-xs text-secondary">Video will be attached to this player profile.</p>
              </div>
            ) : (
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-secondary">Player name</span>
                  <input
                    key={`new-player-name`}
                    {...form.register('name')}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-background px-4 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
                    data-spikeiq-field="name"
                  />
                  {form.formState.errors.name ? <p className="text-xs text-danger">{form.formState.errors.name.message}</p> : null}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-secondary">Position</span>
                  <select
                    key={`new-player-position`}
                    {...form.register('position')}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-background px-4 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
                    data-spikeiq-field="position"
                  >
                    <option>Outside hitter</option>
                    <option>Opposite</option>
                    <option>Middle blocker</option>
                    <option>Setter</option>
                    <option>Libero</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-secondary">Dominant hand</span>
                  <select
                    key={`new-player-dominant-hand`}
                    {...form.register('dominantHand')}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-background px-4 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
                    data-spikeiq-field="dominantHand"
                  >
                    <option>Left</option>
                    <option>Right</option>
                  </select>
                </label>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-3xl border border-spike/20 bg-spike/[0.045] p-6"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-spike">Saving session</p>
                      <p className="mt-1 text-secondary">{uploadSteps[activeStep]?.label}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-spike" />
                  </div>
                  <Progress value={((activeStep + 1) / uploadSteps.length) * 100} className="h-3" />
                  {saveError ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{saveError}</p> : null}
                  <div className="mt-5 space-y-3">
                    {uploadSteps.map((step, index) => (
                      <div key={step.label} className="flex items-center gap-3 text-sm">
                        <span className={cn('h-2.5 w-2.5 rounded-full', index <= activeStep ? 'bg-spike shadow-glow' : 'bg-white/10')} />
                        <span className={index <= activeStep ? 'text-primary' : 'text-muted'}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <Button type="submit" size="lg" className="w-full" disabled={!file || form.formState.isSubmitting} data-spikeiq-button="save">
                    <Volleyball className="h-5 w-5" />
                    Analyze clip locally
                  </Button>
                  {!file ? <p className="mt-3 text-center text-sm text-muted">Choose a video file to continue.</p> : null}
                  {saveError && !isSaving ? <p className="mt-3 text-center text-sm text-danger">{saveError}</p> : null}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
