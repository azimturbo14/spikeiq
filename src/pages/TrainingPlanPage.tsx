import { Dumbbell, PauseCircle } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayers } from '@/hooks/usePlayers'
import { useSessions } from '@/hooks/useSessions'

export function TrainingPlanPage() {
  const { selectedPlayerId } = usePlayers()
  const sessions = useSessions(selectedPlayerId)
  const analyzedSessions = sessions.filter((session) => session.status === 'analyzed')

  if (!selectedPlayerId) {
    return <EmptyState title="Create a player first" description="Training plans are generated per player after local heuristic analysis results exist." />
  }

  if (analyzedSessions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="No training plan yet"
          description="SpikeIQ will not create a fake plan from an unanalyzed clip. Upload videos, then use the local heuristic estimates to guide training focus."
          actionLabel="Upload session"
          actionTo="/analyze?mode=quick"
        />
        <Card className="mt-6 overflow-hidden">
          <CardHeader>
            <CardTitle>Plan generation rule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <PauseCircle className="mt-0.5 h-5 w-5 text-spike" />
              <p className="text-sm leading-6 text-secondary">
                A training plan requires estimated weaknesses from analyzed spike data. Until then, SpikeIQ keeps this page honest and avoids hallucinated drills.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestAnalysis = analyzedSessions.at(-1)?.analysis

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Training plan</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Estimate-based plan workspace.</h1>
        <p className="mt-3 max-w-2xl text-secondary">{analyzedSessions.length} analyzed session(s) with local heuristic estimates are available for plan generation.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Estimated focus areas</CardTitle>
              <p className="text-sm text-secondary">Drills are generated from the latest local heuristic analysis result.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestAnalysis ? (
            <>
              <p className="text-sm leading-6 text-secondary">{latestAnalysis.summary}</p>
              <div className="grid gap-3 md:grid-cols-3">
                <PlanMetric label="Spike attempts" value={latestAnalysis.spikeCount.toString()} />
                <PlanMetric label="Estimated spike height" value={`${latestAnalysis.estimatedSpikeHeightCm} cm`} />
                <PlanMetric label="Direction accuracy estimate" value={`${latestAnalysis.directionAccuracy}%`} />
                <PlanMetric label="Contact consistency estimate" value={`${latestAnalysis.contactConsistency}%`} />
              </div>
              <div className="rounded-2xl border border-spike/20 bg-spike/[0.06] p-4">
                <p className="text-sm font-semibold text-primary">This week's focus</p>
                <ul className="mt-3 space-y-3 text-sm text-secondary">
                  {latestAnalysis.trainingFocus.map((focus) => (
                    <li key={focus} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spike" />
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm leading-6 text-secondary">Analysis completed, but no training focus was returned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-black text-primary">{value}</p>
    </div>
  )
}
