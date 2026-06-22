import { CheckCircle2, RotateCcw, UsersRound, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { PlayerSwitcher } from '@/components/forms/PlayerSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { db } from '@/db/spikeiqDb'
import { usePlayers } from '@/hooks/usePlayers'
import { useSessions } from '@/hooks/useSessions'
import { useVideos } from '@/hooks/useVideos'
import { usePlayerStore } from '@/store/appStore'
import { formatDate } from '@/utils/format'

export function PlayersPage() {
  const { selectedPlayerId } = usePlayers()
  const setSelectedPlayerId = usePlayerStore((state) => state.setSelectedPlayerId)
  const sessions = useSessions(selectedPlayerId)
  const videos = useVideos(selectedPlayerId)
  const latestSession = sessions.at(-1) ?? null

  async function resetLocalData() {
    const confirmed = window.confirm('Reset all local SpikeIQ data? This deletes players, sessions, and saved videos from this browser.')
    if (!confirmed) return

    await db.transaction('rw', db.players, db.sessions, db.videos, async () => {
      await db.players.clear()
      await db.sessions.clear()
      await db.videos.clear()
    })

    setSelectedPlayerId(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Player separation</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Every player gets a clean data lane.</h1>
        <p className="mt-3 max-w-2xl text-secondary">Sessions, videos, and future analysis results are scoped to the active player. SpikeIQ will not mix one athlete's clips into another athlete's reports.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Active player workspace</CardTitle>
                <p className="text-sm text-secondary">Create, switch, or remove player profiles here.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PlayerSwitcher />
            <div className="mt-5">
              <Button type="button" variant="destructive" size="sm" className="w-full" onClick={resetLocalData}>
                <RotateCcw className="h-4 w-4" />
                Reset local data
              </Button>
              <p className="mt-2 text-xs text-muted">Use this when you want the website to start fresh after a reload.</p>
            </div>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <IsolationStat label="Saved sessions" value={sessions.length} />
              <IsolationStat label="Saved videos" value={videos.length} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Isolation rules</CardTitle>
            <p className="text-sm text-secondary">These rules are enforced in the local database and UI routing.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Rule label="Uploads attach to the active player" />
            <Rule label="Session reports only read that player's sessions" />
            <Rule label="Deleting a player cascades their sessions and videos" />
            <Rule label="Trends and plans stay empty until real analysis exists" />
          </CardContent>
        </Card>
      </div>

      {latestSession ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Latest session for this player</CardTitle>
                <p className="text-sm text-secondary">{formatDate(latestSession.createdAt)}</p>
              </div>
              <Badge variant={latestSession.status === 'pending' ? 'warning' : latestSession.status === 'analyzed' ? 'success' : 'danger'}>{latestSession.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-secondary">{latestSession.fileName ?? latestSession.title}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">Open the report to confirm the saved video and pending-analysis state.</p>
              <Button variant="outline" asChild>
                <Link to={`/session/${latestSession.id}`}>Open report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No player sessions yet"
          description="Select or create a player, then upload a real spike clip. The session will be saved as pending analysis."
          actionLabel="Upload session"
          actionTo="/analyze?mode=quick"
        />
      )}
    </div>
  )
}

function IsolationStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-spike">
        <CheckCircle2 className="h-4 w-4" />
        {label}
      </div>
      <p className="font-display text-3xl font-black text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">Scoped to the active player</p>
    </div>
  )
}

function Rule({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <Video className="mt-0.5 h-4 w-4 shrink-0 text-spike" />
      <p className="text-sm leading-6 text-secondary">{label}</p>
    </div>
  )
}
