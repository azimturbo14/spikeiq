import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-spike focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-spike/30 bg-spike/10 text-spike',
        secondary: 'border-white/10 bg-white/5 text-secondary',
        success: 'border-spike/30 bg-spike/10 text-spike',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        danger: 'border-danger/30 bg-danger/10 text-danger',
        info: 'border-info/30 bg-info/10 text-info',
        muted: 'border-white/5 bg-white/5 text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
