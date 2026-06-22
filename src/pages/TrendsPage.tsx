import { BarChart3, Clock, FileVideo } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayers } from '@/hooks/usePlayers'
import { useSessions } from '@/hooks/useSessions'
import { formatDate } from '@/utils/format'

export function TrendsPage() {
  const { selectedPlayerId } = usePlayers()
  const sessions = useSessions(selectedPlayerId)

  if (!selectedPlayerId) {
    return <EmptyState title="Create a player first" description="Trends are isolated per player. Add a player before reviewing session history." />
  }

  if (sessions.length === 0) {
    return <EmptyState title="No trend history yet" description="Upload sessions for this player. Until analysis is connected, trends will show saved upload history and pending status." />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Trends</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Session history, no invented metrics.</h1>
        <p className="mt-3 max-w-2xl text-secondary">SpikeIQ tracks saved analysis sessions per player. Current metrics are local heuristic estimates, not verified biomechanical measurements.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TrendStat icon={<FileVideo className="h-5 w-5" />} label="Saved sessions" value={sessions.length} detail="Videos stored in local database" />
        <TrendStat icon={<Clock className="h-5 w-5" />} label="Pending estimate" value={sessions.filter((session) => session.status === 'pending').length} detail="Awaiting local heuristic analysis" />
        <TrendStat icon={<BarChart3 className="h-5 w-5" />} label="Estimated metrics" value={sessions.filter((session) => session.status === 'analyzed').length} detail="Local heuristic results" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player session history</CardTitle>
          <p className="text-sm text-secondary">Each row is scoped to the active player and links to its report.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.slice().reverse().map((session) => (
              <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-primary">{session.fileName ?? session.title}</p>
                  <p className="mt-1 text-sm text-secondary">{formatDate(session.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={session.status === 'pending' ? 'warning' : session.status === 'analyzed' ? 'success' : 'danger'}>{session.status}</Badge>
                  <a href={`/session/${session.id}`} className="text-sm font-semibold text-spike hover:underline">
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendStat({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">{icon}</div>
      <p className="text-sm text-secondary">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  )
}
