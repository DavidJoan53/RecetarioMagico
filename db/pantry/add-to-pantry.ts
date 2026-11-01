import {db} from '@/db'
import {pantry} from '@/db/schema'

/**
 * Idempotent. The row is keyed by ingredient, so a second add is the same
 * statement — and two tabs toggling at once must not raise a duplicate.
 */
export async function addToPantry(ingredientId: string): Promise<void> {
  await db.insert(pantry).values({ingredientId}).onConflictDoNothing()
}
