import {count, eq} from 'drizzle-orm'
import {db} from '@/db'
import {isStillReferenced} from '@/db/constraints'
import {ingredients, recipeIngredients} from '@/db/schema'

export type DeleteResult =
  | {ok: true}
  | {ok: false; reason: 'not-found'}
  | {ok: false; reason: 'in-use'; recipeCount: number}

/**
 * recipe_ingredients is ON DELETE RESTRICT, so an ingredient a recipe uses
 * cannot go. The constraint is the guard; the count is only for the message.
 *
 * The pantry entry is ON DELETE CASCADE and goes with it silently — the
 * confirmation has to say so, because nothing else will.
 */
export async function deleteIngredient(id: string): Promise<DeleteResult> {
  try {
    const deleted = await db
      .delete(ingredients)
      .where(eq(ingredients.id, id))
      .returning({id: ingredients.id})

    return deleted[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (!isStillReferenced(error)) throw error
    return {ok: false, reason: 'in-use', recipeCount: await usedByCount(id)}
  }
}

async function usedByCount(id: string): Promise<number> {
  const rows = await db
    .select({n: count()})
    .from(recipeIngredients)
    .where(eq(recipeIngredients.ingredientId, id))
  return rows[0]?.n ?? 0
}
