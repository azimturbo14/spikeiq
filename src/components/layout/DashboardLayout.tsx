import type { ReactNode } from 'react'

import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { PlayerSwitcher } from '@/components/forms/PlayerSwitcher'
import { AnimatedPage } from '@/components/AnimatedPage'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-primary">
      <DashboardSidebar />
      <main className="min-h-screen lg:pl-72">
        <div className="sticky top-0 z-30 border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-8 lg:px-10">
          <PlayerSwitcher compact />
        </div>
        <AnimatedPage className="min-h-screen px-4 py-5 sm:px-8 lg:px-10">{children}</AnimatedPage>
      </main>
    </div>
  )
}
