import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {isDuplicate} from '@/db/constraints'
import {ingredients} from '@/db/schema'
import type {IngredientInput} from '@/lib/validation/ingredient'

export type UpdateResult =
  | {ok: true}
  | {ok: false; reason: 'duplicate-name' | 'not-found'}

/**
 * The unique index decides, not a read beforehand — a name taken between the
 * check and the write would get past it.
 */
export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<UpdateResult> {
  try {
    const updated = await db
      .update(ingredients)
      .set(input)
      .where(eq(ingredients.id, id))
      .returning({id: ingredients.id})

    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    throw error
  }
}
