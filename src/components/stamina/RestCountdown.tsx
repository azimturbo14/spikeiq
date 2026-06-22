import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function RestCountdown({ seconds, onComplete, onSkip, onAddTime }: { seconds: number; onComplete: () => void; onSkip: () => void; onAddTime: (extraSeconds: number) => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [remaining, onComplete])

  const progress = ((seconds - remaining) / seconds) * 100

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Rest period</p>
      <p className="mt-3 font-display text-6xl font-black tracking-tight text-primary">{remaining}s</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary">This rest period helps SpikeIQ measure how your jump, speed, and decision-making change under fatigue.</p>
      <Progress value={progress} className="mt-6 h-3" />
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="muted" size="sm" onClick={() => onAddTime(15)}>
          Add 15s
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSkip}>
          Skip rest
        </Button>
      </div>
    </div>
  )
}
