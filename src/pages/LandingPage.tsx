import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Target, Volleyball } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Target,
    title: 'Your technique, not theirs',
    description: 'Coaching built around your unique body mechanics, not a perfect-player blueprint.',
  },
  {
    icon: Clock3,
    title: '0.1 second decisions, analyzed',
    description: 'Frame-level breakdowns show what worked, what got read, and why.',
  },
  {
    icon: Volleyball,
    title: 'Two metrics that matter',
    description: 'Physicality and direction accuracy turn every spike into a clear training signal.',
  },
]

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-primary">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <svg className="absolute left-1/2 top-16 h-[720px] w-[900px] -translate-x-1/2 text-white/5" viewBox="0 0 900 720" aria-hidden="true">
          <motion.rect
            x="80"
            y="80"
            width="740"
            height="560"
            rx="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.2 }}
          />
          <motion.line x1="450" y1="80" x2="450" y2="640" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 0.8 }} />
          <motion.circle cx="450" cy="360" r="72" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 1.1 }} />
          <motion.line x1="80" y1="360" x2="820" y2="360" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 1.35 }} />
          <motion.line x1="190" y1="80" x2="190" y2="640" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 1.6 }} />
          <motion.line x1="710" y1="80" x2="710" y2="640" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 1.6 }} />
        </svg>
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 sm:px-10 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-spike/20 bg-spike/10 px-4 py-2 text-sm font-semibold text-spike">
            <span className="h-2 w-2 rounded-full bg-spike shadow-glow" />
            AI volleyball spike analysis
          </div>
          <h1 className="font-display text-5xl font-black tracking-tight text-primary sm:text-7xl lg:text-8xl">
            Every spike tells a story.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary sm:text-xl">
            SpikeIQ analyzes your spike technique frame-by-frame and builds a training plan around how YOU hit — not a template.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/analyze">
                Analyze my first clip
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/analyze">Upload your first session</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-20 grid gap-4 sm:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-white/10 bg-card/70 backdrop-blur">
                <CardContent className="p-6">
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-spike/10 text-spike">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-primary">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-secondary">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      </section>
    </main>
  )
}
