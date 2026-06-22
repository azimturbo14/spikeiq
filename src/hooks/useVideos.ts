import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/db/spikeiqDb'
import type { SpikeIQVideo } from '@/types/video'

export function useVideos(playerId?: string | null) {
  const videos = useLiveQuery<SpikeIQVideo[]>(
    () => {
      if (!playerId) return Promise.resolve([] as SpikeIQVideo[])
      return db.videos.where('playerId').equals(playerId).sortBy('createdAt')
    },
    [playerId],
  )

  return videos ?? []
}

export async function saveVideo(video: Omit<SpikeIQVideo, 'id' | 'createdAt'>) {
  const savedVideo: SpikeIQVideo = {
    ...video,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  await db.videos.put(savedVideo)
  return savedVideo
}

export async function getVideo(videoId: string) {
  return db.videos.get(videoId)
}

export function useVideo(videoId?: string | null) {
  return useLiveQuery<SpikeIQVideo | undefined>(() => (videoId ? db.videos.get(videoId) : undefined), [videoId])
}
