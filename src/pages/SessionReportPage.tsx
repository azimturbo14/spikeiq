import { AlertTriangle, CalendarDays, FileVideo, PauseCircle, User, Video } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { SpikeAnalysis } from '@/types/session'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { usePlayers } from '@/hooks/usePlayers'
import { useSessions } from '@/hooks/useSessions'
import { useVideo } from '@/hooks/useVideos'
import { BACKEND_ANALYSIS_ENABLED } from '@/lib/analysisApi'
import { formatDate, formatFileSize } from '@/utils/format'

export function SessionReportPage() {
  const { id } = useParams()
  const { players, selectedPlayerId } = usePlayers()
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const sessions = useSessions(selectedPlayerId)
  const requestedSession = id && id !== 'latest' ? sessions.find((item) => item.id === id) : sessions.at(-1) ?? null
  const video = useVideo(requestedSession?.videoId)
  const videoUrl = useMemo(() => (video ? URL.createObjectURL(video.blob) : ''), [video])

  if (!selectedPlayer) {
    return <EmptyState title="Create a player first" description="SpikeIQ isolates every video and session by player profile." />
  }

  if (id && id !== 'latest' && !requestedSession) {
    return <EmptyState title="Session not found for this player" description="That session belongs to another player or no longer exists. Switch back to the original player or open the latest session for the active player." actionLabel="Open latest session" actionTo="/session/latest" />
  }

  if (!requestedSession) {
    return <EmptyState title="No sessions for this player yet" description="Upload a spike video while this player is selected. The session will stay pending until local heuristic analysis finishes." />
  }

  return (
    <div className="mx-auto max-w-6xl -mt-5 space-y-6 scroll-mt-6">
      <div className="lg:sticky lg:top-5 lg:z-30">
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-card/95 p-4 shadow-card backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Session report</p>
            <h1 className="mt-1 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">{requestedSession.status === 'analyzed' ? 'Local estimate ready' : requestedSession.status === 'analyzing' ? 'Estimating locally' : 'Pending local estimate'}</h1>
          </div>
          <div className="grid gap-2 text-sm text-secondary sm:grid-cols-3">
            <SessionMeta icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDate(requestedSession.createdAt)} />
            <SessionMeta icon={<User className="h-4 w-4" />} label="Player" value={selectedPlayer.name} />
            <SessionMeta icon={<FileVideo className="h-4 w-4" />} label="Status" value={statusLabel(requestedSession.status)} />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Uploaded video</CardTitle>
              <Badge variant={requestedSession.status === 'pending' ? 'warning' : requestedSession.status === 'analyzing' ? 'muted' : requestedSession.status === 'failed' ? 'danger' : 'success'}>{statusLabel(requestedSession.status)}</Badge>
            </div>
            <p className="text-sm text-secondary">This clip is saved locally and scoped to {selectedPlayer.name}. {requestedSession.status === 'analyzed' ? 'The local heuristic analyser has generated first-pass spike estimates.' : 'The local heuristic analyser will estimate spike metrics after the video is queued.'}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {video ? (
              <video
                src={videoUrl}
                controls
                className="max-h-[56vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-black object-contain"
              />
            ) : (
              <div className="grid h-64 place-items-center rounded-3xl border border-white/10 bg-white/[0.025] text-secondary">
                <Video className="h-10 w-10" />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoPill label="File" value={requestedSession.fileName ?? 'Unknown'} />
              <InfoPill label="Size" value={video ? formatFileSize(video.size) : 'Pending'} />
              <InfoPill label="Session" value={requestedSession.id.slice(0, 8)} />
            </div>
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Local estimate status</CardTitle>
              <p className="text-sm text-secondary">{requestedSession.status === 'analyzed' ? 'The local heuristic analyser completed first-pass estimates.' : requestedSession.status === 'failed' ? 'The local analyser could not estimate metrics for this clip.' : 'The video is queued for local heuristic analysis.'}</p>
              {!BACKEND_ANALYSIS_ENABLED ? (
                <div className="rounded-2xl border border-info/30 bg-info/[0.08] p-4 text-sm text-info">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Backend API inactive</p>
                      <p className="mt-1 text-secondary">SpikeIQ is using local heuristic estimates only. The Express/Multer/FFmpeg API is inactive/experimental and is not required for this report.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRow label="Video saved" state="done" />
              <StatusRow label="Player session created" state="done" />
              <StatusRow label="Local spike estimate" state={requestedSession.status === 'analyzed' ? 'done' : requestedSession.status === 'failed' ? 'blocked' : 'pending'} />
              <StatusRow label="Direction accuracy estimate" state={requestedSession.status === 'analyzed' ? 'done' : requestedSession.status === 'failed' ? 'blocked' : 'pending'} />
              <StatusRow label="Training focus estimate" state={requestedSession.status === 'analyzed' ? 'done' : requestedSession.status === 'failed' ? 'blocked' : 'pending'} />
              {requestedSession.status === 'pending' || requestedSession.status === 'analyzing' ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm text-secondary">
                  <div className="flex items-start gap-3">
                    <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-spike" />
                    <div>
                      <p className="font-semibold text-primary">Local analysis queued</p>
                      <p className="mt-1">SpikeIQ samples video frames in the browser and estimates motion-based spike metrics.</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {requestedSession.analysisError ? (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Analysis failed</p>
                      <p>{requestedSession.analysisError}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {requestedSession.analysis ? (
            <AnalysisMetrics analysis={requestedSession.analysis} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No fake metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-secondary">
                  SpikeIQ intentionally shows zero inferred metrics until the local analyser finishes. A single saved clip is not enough to claim verified spike count, jump height, or direction accuracy without analysis.
                </p>
                <Separator className="my-4" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <PauseCircle className="mb-3 h-6 w-6 text-spike" />
                  <p className="text-sm font-semibold text-primary">Awaiting local estimate</p>
                  <p className="mt-1 text-sm text-secondary">When the local analyser returns estimates, this page will display spike-level metrics and training focus.</p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SessionMeta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-semibold text-primary">{value}</p>
    </div>
  )
}

function AnalysisMetrics({ analysis }: { analysis: SpikeAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local heuristic estimates</CardTitle>
        <p className="text-sm text-secondary">First-pass estimates from sampled video frames. These are useful for training direction, not verified biomechanical measurements.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="Spike attempts" value={analysis.spikeCount.toString()} />
          <MetricTile label="Estimated spike height" value={`${analysis.estimatedSpikeHeightCm} cm`} />
          <MetricTile label="Direction accuracy estimate" value={`${analysis.directionAccuracy}%`} />
          <MetricTile label="Contact consistency estimate" value={`${analysis.contactConsistency}%`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile label="Approach angle" value={`${analysis.approachAngle}°`} />
          <MetricTile label="Motion score" value={`${analysis.motionScore}%`} />
          <MetricTile label="Confidence" value={`${analysis.confidence}%`} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-sm font-semibold text-primary">Estimate summary</p>
          <p className="mt-2 text-sm leading-6 text-secondary">{analysis.summary}</p>
        </div>
        <div className="rounded-2xl border border-spike/20 bg-spike/[0.06] p-4">
          <p className="text-sm font-semibold text-primary">Estimated training focus</p>
          <ul className="mt-2 space-y-2 text-sm text-secondary">
            {analysis.trainingFocus.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spike" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-black text-primary">{value}</p>
    </div>
  )
}

function StatusRow({ label, state }: { label: string; state: 'done' | 'pending' | 'blocked' }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <span className="text-sm text-secondary">{label}</span>
      {state === 'done' ? <Badge variant="success">Done</Badge> : state === 'pending' ? <Badge variant="warning">Pending estimate</Badge> : <Badge variant="muted">Pending</Badge>}
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-primary">{value}</p>
    </div>
  )
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Pending estimate'
  if (status === 'analyzing') return 'Estimating'
  if (status === 'analyzed') return 'Estimated'
  return 'Failed'
}
