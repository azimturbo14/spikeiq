import { FileVideo, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayers } from '@/hooks/usePlayers'
import { useSessions } from '@/hooks/useSessions'
import type { Session } from '@/types/session'
import { formatDate } from '@/utils/format'

export function SessionHistoryView() {
  const { selectedPlayerId } = usePlayers()
  const sessions = useSessions(selectedPlayerId)
  const sortedSessions = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (!selectedPlayerId) {
    return <EmptyState title="Create a player first" description="SpikeIQ keeps all analysis history scoped to the active player." />
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player history</CardTitle>
          <p className="text-sm text-secondary">Every quick analysis, gameplay clip, and stamina test will appear here.</p>
        </CardHeader>
        <CardContent>
          <EmptyMini title="No sessions yet" description="Analyze a clip or start a stamina test to build this player's history." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player history</CardTitle>
        <p className="text-sm text-secondary">A chronological feed of every session for the active player.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSessions.map((session) => (
            <SessionHistoryRow key={session.id} session={session} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SessionHistoryRow({ session }: { session: Session }) {
  const type = sessionTypeLabel(session)
  const status = session.status

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <FileVideo className="h-4 w-4 shrink-0 text-spike" />
          <p className="truncate text-sm font-semibold text-primary">{session.fileName ?? session.title}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
          <Badge variant={type.variant}>{type.label}</Badge>
          <span>{formatDate(session.createdAt)}</span>
          <span>·</span>
          <span>{status}</span>
        </div>
      </div>
      <Link to={`/session/${session.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-spike/20 bg-spike/10 px-3 py-2 text-sm font-semibold text-spike transition-colors hover:bg-spike/15">
        <LinkIcon className="h-4 w-4" />
        Open report
      </Link>
    </div>
  )
}

function sessionTypeLabel(session: Session) {
  if (session.sessionType === 'stamina') {
    return { label: 'Stamina Test', variant: 'info' as const }
  }

  if (session.sessionType === 'gameplay') {
    return { label: 'Gameplay Clips', variant: 'secondary' as const }
  }

  return { label: 'Quick Analysis', variant: 'success' as const }
}

function EmptyMini({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-center">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-1 text-sm text-secondary">{description}</p>
    </div>
  )
}
