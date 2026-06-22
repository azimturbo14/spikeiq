import Dexie, { type Table } from 'dexie'

import type { Player } from '@/types/player'
import type { Session } from '@/types/session'
import type { SpikeIQVideo } from '@/types/video'

export class SpikeIQDatabase extends Dexie {
  players!: Table<Player, string>
  sessions!: Table<Session, string>
  videos!: Table<SpikeIQVideo, string>

  constructor() {
    super('spikeiq-production-db')

    this.version(1).stores({
      players: '&id, name, createdAt',
      sessions: '&id, playerId, status, createdAt, updatedAt, videoId',
      videos: '&id, playerId, sessionId, fileName, createdAt',
    })
  }
}

export const db = new SpikeIQDatabase()
