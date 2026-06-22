import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spike focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-spike text-background shadow-glow hover:bg-spike-hover',
        destructive: 'bg-danger text-primary hover:bg-danger/90',
        outline: 'border border-white/15 bg-transparent text-primary hover:bg-white/5',
        ghost: 'text-secondary hover:bg-white/5 hover:text-primary',
        muted: 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
