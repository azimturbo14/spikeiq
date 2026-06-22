import { cn } from '@/lib/utils'
import type { StaminaAttempt, StaminaAttemptStatus } from '@/types/session'

const statusOrder: StaminaAttemptStatus[] = ['pending', 'recorded', 'analyzing', 'analyzed', 'failed', 'skipped']

export function AttemptProgressStrip({ attempts, currentIndex, targetAttempts }: { attempts: StaminaAttempt[]; currentIndex?: number; targetAttempts: number }) {
  return (
    <div className="grid grid-cols-10 gap-2" aria-label="Stamina session progress">
      {Array.from({ length: targetAttempts }, (_, index) => {
        const attempt = attempts[index]
        const status = attempt?.status ?? 'pending'
        const active = currentIndex === index
        return <AttemptDot key={index} status={status} active={active} complete={statusOrder.indexOf(status) >= statusOrder.indexOf('recorded')} />
      })}
    </div>
  )
}

function AttemptDot({ status, active, complete }: { status: StaminaAttemptStatus; active: boolean; complete: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'h-3 w-3 rounded-full border transition-all',
          active && 'border-spike bg-spike shadow-glow scale-125',
          complete && !active && 'border-spike bg-spike',
          status === 'failed' && !active && 'border-danger bg-danger',
          status === 'skipped' && !active && 'border-warning bg-warning',
          status === 'pending' && !active && 'border-white/10 bg-white/[0.04]',
          status === 'analyzing' && !active && 'border-spike bg-spike/20 animate-pulse',
        )}
      />
    </div>
  )
}
