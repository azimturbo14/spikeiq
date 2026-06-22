import { FileVideo, UploadCloud, Zap } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSession, updateSessionStatus, updateSessionVideo } from '@/hooks/useSessions'
import { saveVideo } from '@/hooks/useVideos'
import { BACKEND_ANALYSIS_ENABLED, queueBackendAnalysisIfEnabled } from '@/lib/analysisApi'
import { analyzeLocalVideo } from '@/lib/localVideoAnalysis'
import { cn } from '@/lib/utils'
import { usePlayers } from '@/hooks/usePlayers'
import type { SpikeAnalysis } from '@/types/session'

type ClipOutcome = 'unknown' | 'point' | 'tool' | 'blocked' | 'out' | 'dug'

type ClipFile = {
  file: File
  outcome: ClipOutcome
  status: 'ready' | 'analysing' | 'analysed' | 'failed'
  analysis?: SpikeAnalysis
  error?: string
}

type AggregateReport = {
  totalAttacks: number
  knownOutcomes: number
  successRate: number | null
  averageDirectionAccuracy: number | null
  averageEstimatedSpikeHeightCm: number | null
  averageContactConsistency: number | null
  improvementFocus: string[]
}

const outcomeLabels: Record<ClipOutcome, string> = {
  unknown: 'Unknown',
  point: 'Point',
  tool: 'Tool / block out',
  blocked: 'Blocked',
  out: 'Out',
  dug: 'Dug / kept alive',
}

export function GameplayClipsPage() {
  const { players, selectedPlayerId } = usePlayers()
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const [clips, setClips] = useState<ClipFile[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [report, setReport] = useState<AggregateReport | null>(null)

  if (!selectedPlayer) {
    return <EmptyState title="Create a player first" description="Gameplay Clips compares multiple attacks from one player, so choose or create a player first." />
  }

  const analysedClips = clips.filter((clip) => clip.analysis)
  const hasClips = clips.length > 0

  function addFiles(files: FileList | null) {
    const nextClips = Array.from(files ?? [])
      .filter((file) => file.type.startsWith('video/'))
      .map((file): ClipFile => ({ file, outcome: 'unknown', status: 'ready' }))

    setClips((current) => [...current, ...nextClips])
    setReport(null)
  }

  function updateOutcome(index: number, outcome: ClipOutcome) {
    setClips((current) => current.map((clip, clipIndex) => (clipIndex === index ? { ...clip, outcome } : clip)))
    setReport(null)
  }

  function removeClip(index: number) {
    setClips((current) => current.filter((_, clipIndex) => clipIndex !== index))
    setReport(null)
  }

  async function scanClips() {
    if (!selectedPlayer || clips.length === 0) return

    setIsScanning(true)
    setScanError(null)
    setReport(null)

    const analysed: SpikeAnalysis[] = []

    for (let index = 0; index < clips.length; index += 1) {
      const clip = clips[index]
      setClips((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: 'analysing' } : item)))

      try {
        const session = await createSession({
          playerId: selectedPlayer.id,
          status: 'analyzing',
          title: clip.file.name,
          fileName: clip.file.name,
          sessionType: 'gameplay',
        })

        const savedVideo = await saveVideo({
          playerId: selectedPlayer.id,
          sessionId: session.id,
          fileName: clip.file.name,
          mimeType: clip.file.type || 'video/unknown',
          size: clip.file.size,
          blob: clip.file,
        })

        await updateSessionVideo(session.id, savedVideo.id, clip.file.name)

        const { analysis } = await analyzeLocalVideo(clip.file, clip.file.name)
        analysed.push(analysis)

        await updateSessionStatus(session.id, 'analyzed', undefined, analysis)

        if (BACKEND_ANALYSIS_ENABLED) {
          queueBackendAnalysisIfEnabled({
            sessionId: session.id,
            playerId: selectedPlayer.id,
            fileName: clip.file.name,
            blob: clip.file,
          }).catch(() => undefined)
        }

        setClips((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  status: 'analysed',
                  analysis,
                  error: undefined,
                }
              : item,
          ),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to analyse this clip.'
        setScanError(message)
        setClips((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  status: 'failed',
                  error: message,
                }
              : item,
          ),
        )
      }
    }

    setReport(buildAggregateReport(clips, analysed))
    setIsScanning(false)
  }

  const analysedAnalyses = analysedClips.map((clip) => clip.analysis).filter((analysis): analysis is SpikeAnalysis => Boolean(analysis))
  const aggregate = buildAggregateReport(clips, analysedAnalyses)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Gameplay Clips</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Analyze gameplay clips.</h1>
        <p className="mt-3 max-w-3xl text-secondary">Upload gameplay clips in any order. SpikeIQ treats each clip as one attack, estimates metrics locally, then aggregates the batch.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Gameplay clips</CardTitle>
            <p className="text-sm text-secondary">Add as many spike clips as you want. Order does not matter because each clip is analyzed as a separate attack.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <FileDropZone onFiles={addFiles} disabled={isScanning} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={scanClips} disabled={!hasClips || isScanning}>
                <Zap className="h-4 w-4" />
                {isScanning ? 'Analyzing batch...' : 'Analyze gameplay batch'}
              </Button>
              <Button variant="muted" onClick={() => setClips([])} disabled={!hasClips || isScanning}>
                Clear clips
              </Button>
            </div>

            {scanError ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/[0.08] p-4 text-sm text-danger">
                {scanError}
              </div>
            ) : null}

            <div className="space-y-3">
              {clips.map((clip, index) => (
                <ClipRow key={`${clip.file.name}-${index}`} clip={clip} index={index} onOutcomeChange={updateOutcome} onRemove={removeClip} />
              ))}
              {!hasClips ? <EmptyMini title="No gameplay clips added yet" description="Upload gameplay spike clips and SpikeIQ will analyze them together." /> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch estimates</CardTitle>
            <p className="text-sm text-secondary">These are aggregated local heuristic estimates across the uploaded attacks.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {report ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FactorTile label="Attacks scanned" value={report.totalAttacks.toString()} />
                  <FactorTile label="Success rate" value={report.successRate === null ? 'Unknown' : `${Math.round(report.successRate)}%`} />
                  <FactorTile label="Avg direction accuracy" value={report.averageDirectionAccuracy === null ? 'Unknown' : `${Math.round(report.averageDirectionAccuracy)}%`} />
                  <FactorTile label="Avg estimated spike height" value={report.averageEstimatedSpikeHeightCm === null ? 'Unknown' : `${Math.round(report.averageEstimatedSpikeHeightCm)} cm`} />
                  <FactorTile label="Avg contact consistency" value={report.averageContactConsistency === null ? 'Unknown' : `${Math.round(report.averageContactConsistency)}%`} />
                  <FactorTile label="Analysed clips" value={analysedClips.length.toString()} />
                </div>

                <div className="rounded-2xl border border-spike/20 bg-spike/[0.06] p-4">
                  <p className="text-sm font-semibold text-primary">Estimated improvement priorities</p>
                  <ul className="mt-3 space-y-2 text-sm text-secondary">
                    {report.improvementFocus.map((focus) => (
                      <li key={focus} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spike" />
                        <span>{focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : aggregate && hasClips ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <FactorTile label="Ready clips" value={clips.length.toString()} />
                <FactorTile label="Analysed clips" value={analysedClips.length.toString()} />
                <FactorTile label="Avg direction accuracy" value={aggregate.averageDirectionAccuracy === null ? 'Unknown' : `${Math.round(aggregate.averageDirectionAccuracy)}%`} />
                <FactorTile label="Avg estimated spike height" value={aggregate.averageEstimatedSpikeHeightCm === null ? 'Unknown' : `${Math.round(aggregate.averageEstimatedSpikeHeightCm)} cm`} />
              </div>
            ) : (
              <EmptyMini title="No batch estimates yet" description="After analyzing, SpikeIQ will show estimated success rate, direction accuracy, spike height, and improvement priorities." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ClipRow({ clip, index, onOutcomeChange, onRemove }: { clip: ClipFile; index: number; onOutcomeChange: (index: number, outcome: ClipOutcome) => void; onRemove: (index: number) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileVideo className="h-4 w-4 shrink-0 text-spike" />
            <p className="truncate text-sm font-semibold text-primary">{clip.file.name}</p>
          </div>
          <p className="mt-1 text-xs text-secondary">Attack {index + 1} · {clip.status}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={clip.outcome}
            onChange={(event) => onOutcomeChange(index, event.target.value as ClipOutcome)}
            className="h-10 rounded-xl border border-white/10 bg-background px-3 text-xs font-semibold text-primary outline-none focus:border-spike"
            aria-label={`Outcome for attack ${index + 1}`}
          >
            {Object.entries(outcomeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
            Remove
          </Button>
        </div>
      </div>
      {clip.error ? <p className="mt-3 text-xs text-danger">{clip.error}</p> : null}
    </div>
  )
}

function FileDropZone({ onFiles, disabled }: { onFiles: (files: FileList | null) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.025] p-10 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-spike focus:ring-offset-2 focus:ring-offset-background',
        dragging && 'border-spike bg-spike/[0.045]',
        disabled && 'opacity-60',
      )}
      onClick={() => document.querySelector<HTMLInputElement>('[data-sessions-files]')?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        onFiles(event.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          document.querySelector<HTMLInputElement>('[data-sessions-files]')?.click()
        }
      }}
    >
      <input
        type="file"
        accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
        multiple
        className="sr-only"
        data-sessions-files
        onChange={(event) => onFiles(event.target.files)}
      />
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-spike/10 text-spike shadow-glow">
        <UploadCloud className="h-8 w-8" />
      </div>
      <p className="text-lg font-semibold text-primary">Upload gameplay clips</p>
      <p className="mt-2 text-sm text-secondary">Clips can be in any order. Add the result for each attack if you want success rate.</p>
      <Button type="button" variant="outline" size="sm" className="mt-5" disabled={disabled}>
        Choose clips
      </Button>
    </div>
  )
}

function FactorTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-black text-primary">{value}</p>
    </div>
  )
}

function EmptyMini({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-1 text-sm text-secondary">{description}</p>
    </div>
  )
}

function buildAggregateReport(clips: ClipFile[], analyses: SpikeAnalysis[]): AggregateReport {
  const analysed = analyses
  const knownOutcomes = clips.filter((clip) => clip.outcome !== 'unknown')
  const successes = clips.filter((clip) => clip.outcome === 'point' || clip.outcome === 'tool').length
  const averageDirectionAccuracy = average(analysed.map((analysis) => analysis.directionAccuracy))
  const averageEstimatedSpikeHeightCm = average(analysed.map((analysis) => analysis.estimatedSpikeHeightCm))
  const averageContactConsistency = average(analysed.map((analysis) => analysis.contactConsistency))
  const improvementFocus = buildImprovementFocus({
    successRate: knownOutcomes.length ? (successes / knownOutcomes.length) * 100 : null,
    averageDirectionAccuracy,
    averageEstimatedSpikeHeightCm,
    averageContactConsistency,
  })

  return {
    totalAttacks: clips.length,
    knownOutcomes: knownOutcomes.length,
    successRate: knownOutcomes.length ? (successes / knownOutcomes.length) * 100 : null,
    averageDirectionAccuracy,
    averageEstimatedSpikeHeightCm,
    averageContactConsistency,
    improvementFocus,
  }
}

function buildImprovementFocus({ successRate, averageDirectionAccuracy, averageEstimatedSpikeHeightCm, averageContactConsistency }: { successRate: number | null; averageDirectionAccuracy: number | null; averageEstimatedSpikeHeightCm: number | null; averageContactConsistency: number | null }) {
  const focus: string[] = []

  if (successRate !== null && successRate < 50) {
    focus.push('Improve shot selection against blocks: choose line, cross, or over based on the open space instead of forcing the same shot every time.')
  }

  if (averageDirectionAccuracy !== null && averageDirectionAccuracy < 68) {
    focus.push('Direction accuracy is the first priority. Add target-zone reps and call the intended line before each approach.')
  }

  if (averageEstimatedSpikeHeightCm !== null && averageEstimatedSpikeHeightCm < 270) {
    focus.push('Work on contact height and vertical conversion so more attacks clear the top of the block.')
  }

  if (averageContactConsistency !== null && averageContactConsistency < 68) {
    focus.push('Contact consistency needs work. Use high-contact toss drills and 3-step approach rhythm reps.')
  }

  if (focus.length === 0) {
    focus.push('Maintain current attacking habits and add block-reading reps to turn good consistency into more dominant scoring.')
  }

  return focus
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}
