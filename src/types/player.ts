export type PlayerPosition = 'Outside hitter' | 'Opposite' | 'Middle blocker' | 'Setter' | 'Libero'
export type DominantHand = 'Left' | 'Right'

export type Player = {
  id: string
  name: string
  position: PlayerPosition
  dominantHand: DominantHand
  createdAt: string
}

export type PlayerDraft = Omit<Player, 'id' | 'createdAt'>
