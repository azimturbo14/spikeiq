import { useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnalyzePage } from '@/pages/AnalyzePage'
import { GameplayClipsPage } from '@/pages/GameplayClipsPage'
import { LandingPage } from '@/pages/LandingPage'
import { PlayersPage } from '@/pages/PlayersPage'
import { SessionReportPage } from '@/pages/SessionReportPage'
import { TrainingPlanPage } from '@/pages/TrainingPlanPage'
import { TrendsPage } from '@/pages/TrendsPage'

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, behavior: 'instant' })

    return () => {
      history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<DashboardLayout><AnalyzePage /></DashboardLayout>} />
        <Route path="/upload" element={<Navigate to="/analyze?mode=quick" replace />} />
        <Route path="/stamina" element={<Navigate to="/analyze?mode=stamina" replace />} />
        <Route path="/sessions" element={<Navigate to="/analyze?mode=gameplay" replace />} />
        <Route path="/gameplay-clips" element={<DashboardLayout><GameplayClipsPage /></DashboardLayout>} />
        <Route path="/players" element={<DashboardLayout><PlayersPage /></DashboardLayout>} />
        <Route path="/player-separation" element={<Navigate to="/players" replace />} />
        <Route path="/session/:id" element={<DashboardLayout><SessionReportPage /></DashboardLayout>} />
        <Route path="/trends" element={<DashboardLayout><TrendsPage /></DashboardLayout>} />
        <Route path="/plan" element={<DashboardLayout><TrainingPlanPage /></DashboardLayout>} />
        <Route path="/session/demo" element={<Navigate to="/analyze?mode=quick" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
