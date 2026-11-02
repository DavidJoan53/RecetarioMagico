import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {pantry} from '@/db/schema'

/** Quantity goes with it: having none is not the same as having zero. */
export async function removeFromPantry(ingredientId: string): Promise<void> {
  await db.delete(pantry).where(eq(pantry.ingredientId, ingredientId))
}
