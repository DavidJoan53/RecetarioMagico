import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {isMissingReference} from '@/db/constraints'
import {dinnerRecipes, dinners} from '@/db/schema'
import type {DinnerInput} from '@/lib/validation/dinner'

export type UpdateResult =
  | {ok: true}
  | {ok: false; reason: 'not-found' | 'recipe-gone'}

async function exists(id: string): Promise<boolean> {
  const rows = await db
    .select({id: dinners.id})
    .from(dinners)
    .where(eq(dinners.id, id))
    .limit(1)
  return rows.length > 0
}

/**
 * Replaced rather than reconciled: the recipes on a dinner are read and
 * written whole, and working out which to add and which to drop is more code
 * for a set that never exceeds a handful.
 *
 * All three statements go in one batch, so a dinner cannot end up holding
 * the new date and the old recipes.
 */
export async function updateDinner(
  id: string,
  input: DinnerInput,
): Promise<UpdateResult> {
  try {
    const [updated] = await db.batch([
      db
        .update(dinners)
        .set({eatenAt: input.eatenAt, notes: input.notes})
        .where(eq(dinners.id, id))
        .returning({id: dinners.id}),
      db.delete(dinnerRecipes).where(eq(dinnerRecipes.dinnerId, id)),
      db.insert(dinnerRecipes).values(
        input.recipeIds.map(recipeId => ({
          dinnerId: id,
          recipeId,
        })),
      ),
    ])

    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (!isMissingReference(error)) throw error
    /* Two ways to get here: a recipe that has gone, or the dinner itself.
       The insert names both, so which one it was takes another look. */
    return {
      ok: false,
      reason: (await exists(id)) ? 'recipe-gone' : 'not-found',
    }
  }
}
