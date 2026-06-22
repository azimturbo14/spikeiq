import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIStore = {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}))

type PlayerStore = {
  selectedPlayerId: string | null
  setSelectedPlayerId: (playerId: string | null) => void
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      selectedPlayerId: null,
      setSelectedPlayerId: (selectedPlayerId) => set({ selectedPlayerId }),
    }),
    {
      name: 'spikeiq-active-player',
    },
  ),
)
