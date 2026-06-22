import { Plus, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { usePlayers } from '@/hooks/usePlayers'
import { cn } from '@/lib/utils'
import type { PlayerFormValues } from '@/types/forms'
import { playerFormSchema } from '@/types/forms'

export function PlayerSwitcher({ compact = false }: { compact?: boolean }) {
  const { players, selectedPlayerId, setSelectedPlayerId, createPlayer, deletePlayer } = usePlayers()
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: '',
      position: 'Outside hitter',
      dominantHand: 'Right',
    },
  })

  async function submit(values: PlayerFormValues) {
    await createPlayer(values)
    form.reset()
    setIsAdding(false)
  }

  async function handleDelete() {
    if (!selectedPlayer) return
    const confirmed = window.confirm(`Delete ${selectedPlayer.name}? This also removes their saved sessions and videos from this browser.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deletePlayer(selectedPlayer.id)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!selectedPlayer) {
    if (compact) {
      return (
        <div className="rounded-2xl border border-spike/20 bg-spike/[0.045] p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-spike">
            <UsersRound className="h-4 w-4" />
            Create first player
          </div>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
            <input
              {...form.register('name')}
              placeholder="Player name"
              className="h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none focus:border-spike"
            />
            {form.formState.errors.name ? <p className="text-xs text-danger">{form.formState.errors.name.message}</p> : null}
            <Button type="submit" size="sm" className="w-full" disabled={form.formState.isSubmitting}>
              <Plus className="h-4 w-4" />
              Create player
            </Button>
          </form>
        </div>
      )
    }

    return (
      <div className="mt-5 rounded-3xl border border-spike/20 bg-spike/[0.045] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-spike">
          <UsersRound className="h-4 w-4" />
          Create first player
        </div>
        <p className="text-sm leading-6 text-secondary">Every video and session is scoped to a player profile.</p>
        <form onSubmit={form.handleSubmit(submit)} className="mt-4 space-y-3">
          <input
            {...form.register('name')}
            placeholder="Player name"
            className="h-11 w-full rounded-2xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
          />
          {form.formState.errors.name ? <p className="text-xs text-danger">{form.formState.errors.name.message}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <select
              {...form.register('position')}
              className="h-11 rounded-2xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
            >
              <option>Outside hitter</option>
              <option>Opposite</option>
              <option>Middle blocker</option>
              <option>Setter</option>
              <option>Libero</option>
            </select>
            <select
              {...form.register('dominantHand')}
              className="h-11 rounded-2xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
            >
              <option>Right</option>
              <option>Left</option>
            </select>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={form.formState.isSubmitting}>
            <Plus className="h-4 w-4" />
            Create player
          </Button>
        </form>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card/95 p-3 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1 space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <UsersRound className="h-3.5 w-3.5" />
              Active player
            </span>
            <select
              value={selectedPlayer.id}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none focus:border-spike"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} — {player.position}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="muted" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} aria-label="Remove current player">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {isAdding ? (
          <form onSubmit={form.handleSubmit(submit)} className="mt-3 space-y-3 rounded-xl border border-white/10 bg-background p-3">
            <input
              {...form.register('name')}
              placeholder="New player name"
              className="h-10 w-full rounded-xl border border-white/10 bg-card px-3 text-sm font-semibold text-primary outline-none focus:border-spike"
            />
            {form.formState.errors.name ? <p className="text-xs text-danger">{form.formState.errors.name.message}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>Create</Button>
              <Button type="button" variant="muted" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </form>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-spike to-info font-black text-background">
            {initialsFor(selectedPlayer.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{selectedPlayer.name}</p>
            <p className="truncate text-xs text-secondary">{selectedPlayer.position}</p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-danger disabled:opacity-40"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Remove current player"
          title={isDeleting ? 'Deleting player…' : 'Remove current player'}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <label className="space-y-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <UsersRound className="h-3.5 w-3.5" />
          Active player
        </span>
        <select
          value={selectedPlayer.id}
          onChange={(event) => setSelectedPlayerId(event.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-background px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
        >
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} — {player.position}
            </option>
          ))}
        </select>
      </label>

      {isAdding ? (
        <form onSubmit={form.handleSubmit(submit)} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-background p-3">
          <input
            {...form.register('name')}
            placeholder="New player name"
            className="h-11 w-full rounded-2xl border border-white/10 bg-card px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
          />
          {form.formState.errors.name ? <p className="text-xs text-danger">{form.formState.errors.name.message}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <select
              {...form.register('position')}
              className={cn('h-11 rounded-2xl border border-white/10 bg-card px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike')}
            >
              <option>Outside hitter</option>
              <option>Opposite</option>
              <option>Middle blocker</option>
              <option>Setter</option>
              <option>Libero</option>
            </select>
            <select
              {...form.register('dominantHand')}
              className="h-11 rounded-2xl border border-white/10 bg-card px-3 text-sm font-semibold text-primary outline-none transition-colors focus:border-spike"
            >
              <option>Right</option>
              <option>Left</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              Create
            </Button>
            <Button type="button" variant="muted" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="muted" size="sm" className="mt-3 w-full" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
          Add player
        </Button>
      )}
    </div>
  )
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SP'
}
