import type { ReactNode } from 'react'
import { FileVideo, Play, UploadCloud } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { SessionHistoryView } from '@/components/analyze/SessionHistoryView'
import { GameplayClipsPage } from '@/pages/GameplayClipsPage'
import { StaminaSessionPage } from '@/pages/StaminaSessionPage'
import { UploadPage } from '@/pages/UploadPage'

type AnalyzeMode = 'quick' | 'gameplay' | 'stamina'

const modeLabels: Record<AnalyzeMode, string> = {
  quick: 'Quick Analysis',
  gameplay: 'Gameplay Batch',
  stamina: 'Stamina Test',
}

const modeDescriptions: Record<AnalyzeMode, string> = {
  quick: 'Analyze one spike clip and open its report.',
  gameplay: 'Analyze multiple gameplay clips in any order and aggregate batch estimates.',
  stamina: 'Run 10 ordered max-effort attempts with rest-time context.',
}

export function AnalyzePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = normalizeMode(searchParams.get('mode'))

  function setMode(nextMode: AnalyzeMode) {
    setSearchParams({ mode: nextMode })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-spike">Analyze</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-primary sm:text-5xl">Choose how you want to analyze spikes.</h1>
        <p className="mt-3 max-w-3xl text-secondary">All modes use SpikeIQ's local heuristic analyser. The difference is the workflow: one clip, a gameplay batch, or a guided stamina test.</p>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-card p-4 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-lg font-semibold text-primary">{modeLabels[mode]}</p>
          <p className="mt-1 text-sm text-secondary">{modeDescriptions[mode]}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          <ModeButton mode="quick" currentMode={mode} setMode={setMode} icon={<UploadCloud className="h-4 w-4" />} label="Quick" />
          <ModeButton mode="gameplay" currentMode={mode} setMode={setMode} icon={<FileVideo className="h-4 w-4" />} label="Gameplay" />
          <ModeButton mode="stamina" currentMode={mode} setMode={setMode} icon={<Play className="h-4 w-4" />} label="Stamina" />
        </div>
      </div>

      <div className="mt-6">
        <div hidden={mode !== 'quick'}>
          <UploadPage />
        </div>
        <div hidden={mode !== 'gameplay'}>
          <GameplayClipsPage />
        </div>
        <div hidden={mode !== 'stamina'}>
          <StaminaSessionPage />
        </div>
      </div>

      <SessionHistoryView />
    </div>
  )
}

function ModeButton({ mode, currentMode, setMode, icon, label }: { mode: AnalyzeMode; currentMode: AnalyzeMode; setMode: (mode: AnalyzeMode) => void; icon: ReactNode; label: string }) {
  return (
    <Button type="button" variant={currentMode === mode ? 'default' : 'muted'} onClick={() => setMode(mode)}>
      {icon}
      {label}
    </Button>
  )
}

function normalizeMode(value: string | null): AnalyzeMode {
  if (value === 'gameplay') return 'gameplay'
  if (value === 'stamina') return 'stamina'
  return 'quick'
}
