import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/db/spikeiqDb'
import type { Player, PlayerDraft } from '@/types/player'
import { usePlayerStore } from '@/store/appStore'

const EMPTY_PLAYERS: Player[] = []

export function usePlayers() {
  const livePlayers = useLiveQuery<Player[]>(() => db.players.orderBy('name').toArray(), [])
  const players = livePlayers ?? EMPTY_PLAYERS
  const selectedPlayerId = usePlayerStore((state) => state.selectedPlayerId)
  const setSelectedPlayerId = usePlayerStore((state) => state.setSelectedPlayerId)

  useEffect(() => {
    if (selectedPlayerId && players.some((player) => player.id === selectedPlayerId)) return
    setSelectedPlayerId(players[0]?.id ?? null)
  }, [players, selectedPlayerId, setSelectedPlayerId])

  async function createPlayer(draft: PlayerDraft): Promise<Player> {
    const player: Player = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    await db.players.put(player)
    setSelectedPlayerId(player.id)
    return player
  }

  async function deletePlayer(playerId: string) {
    await db.transaction('rw', db.players, db.sessions, db.videos, async () => {
      const sessionIds = (await db.sessions.where('playerId').equals(playerId).toArray()).map((session) => session.id)
      const videoIds = (await db.videos.where('playerId').equals(playerId).toArray()).map((video) => video.id)

      await db.videos.bulkDelete(videoIds)
      await db.sessions.bulkDelete(sessionIds)
      await db.players.delete(playerId)
    })

    if (selectedPlayerId === playerId) {
      const remaining = await db.players.toArray()
      setSelectedPlayerId(remaining[0]?.id ?? null)
    }
  }

  return { players, selectedPlayerId, setSelectedPlayerId, createPlayer, deletePlayer }
}
