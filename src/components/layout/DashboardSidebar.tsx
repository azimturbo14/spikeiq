import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { FileVideo, Menu, TrendingUp, UsersRound, Volleyball, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PlayerSwitcher } from '@/components/forms/PlayerSwitcher'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/analyze', label: 'Analyze', icon: FileVideo },
  { to: '/players', label: 'Players', icon: UsersRound },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/plan', label: 'Training plan', icon: Volleyball },
]

export function DashboardSidebar() {
  const mobileNavOpen = useUIStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-xl border border-white/10 bg-card p-2 text-secondary hover:text-primary lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-background/95 p-5 backdrop-blur-xl lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <SidebarContent mobileNavOpen />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-white/10 bg-background p-5 lg:flex lg:h-screen lg:overflow-y-auto lg:border lg:bg-background">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ mobileNavOpen = false }: { mobileNavOpen?: boolean }) {
  const location = useLocation()
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, setMobileNavOpen])

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <NavLink to="/analyze?mode=quick" className="flex items-center gap-3" onClick={() => setMobileNavOpen(false)}>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-spike/30 bg-spike/10 text-spike shadow-glow">
            <Volleyball className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-primary">SpikeIQ</p>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted">AI Coach</p>
          </div>
        </NavLink>
        {mobileNavOpen ? (
          <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="mt-10 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'bg-spike/10 text-spike' : 'text-secondary hover:bg-white/5 hover:text-primary',
                )
              }
              onClick={() => setMobileNavOpen(false)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto">
        <Separator />
        <PlayerSwitcher />
      </div>
    </>
  )
}
