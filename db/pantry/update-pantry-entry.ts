import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {pantry} from '@/db/schema'
import type {PantryEntryInput} from '@/lib/validation/pantry'

export type UpdateResult = {ok: true} | {ok: false; reason: 'not-in-pantry'}

/** updated_at moves with it, so "how old is this" stays answerable. */
export async function updatePantryEntry(
  ingredientId: string,
  input: PantryEntryInput,
): Promise<UpdateResult> {
  const updated = await db
    .update(pantry)
    .set({...input, updatedAt: new Date()})
    .where(eq(pantry.ingredientId, ingredientId))
    .returning({id: pantry.ingredientId})

  return updated[0] ? {ok: true} : {ok: false, reason: 'not-in-pantry'}
}
