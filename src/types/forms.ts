import { z } from 'zod'

export const playerFormSchema = z.object({
  name: z.string().min(2, 'Enter the player name.'),
  position: z.enum(['Outside hitter', 'Opposite', 'Middle blocker', 'Setter', 'Libero']),
  dominantHand: z.enum(['Left', 'Right']),
})

export type PlayerFormValues = z.infer<typeof playerFormSchema>
