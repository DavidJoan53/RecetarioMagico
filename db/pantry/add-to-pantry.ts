import {db} from '@/db'
import {pantry} from '@/db/schema'
import type {PantryEntryInput} from '@/lib/validation/pantry'

export type AddResult = {ok: true} | {ok: false; reason: 'already-there'}

/**
 * The row is keyed by ingredient, so the unique index answers whether it is
 * already there — no read beforehand, which two tabs could both pass.
 */
export async function addToPantry(
  ingredientId: string,
  entry: PantryEntryInput,
): Promise<AddResult> {
  const inserted = await db
    .insert(pantry)
    .values({ingredientId, ...entry})
    .onConflictDoNothing({target: pantry.ingredientId})
    .returning({id: pantry.ingredientId})

  return inserted[0] ? {ok: true} : {ok: false, reason: 'already-there'}
}
