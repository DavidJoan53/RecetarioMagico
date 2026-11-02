import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {isDuplicate, isMissingReference} from '@/db/constraints'
import {recipeIngredients, recipes} from '@/db/schema'
import type {RecipeInput} from '@/lib/validation/recipe'
import {deriveImageUrl} from '@/lib/youtube'

export type UpdateResult =
  | {ok: true}
  | {ok: false; reason: 'not-found' | 'duplicate-name' | 'ingredient-gone'}

async function exists(id: string): Promise<boolean> {
  const rows = await db
    .select({id: recipes.id})
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1)
  return rows.length > 0
}

/**
 * Replaced rather than reconciled: a recipe's ingredients are read and
 * written whole, and working out which to add, change and drop is more code
 * for a set that never exceeds a handful.
 *
 * Every statement goes in one batch, so a recipe cannot end up holding the
 * new name and the old amounts.
 */
export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<UpdateResult> {
  const {ingredients: rows, ...recipe} = input

  const update = db
    .update(recipes)
    .set({...recipe, imageUrl: deriveImageUrl(recipe.links)})
    .where(eq(recipes.id, id))
    .returning({id: recipes.id})

  const clear = db
    .delete(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))

  try {
    /* Drizzle refuses an insert with no values, so clearing them is the whole
       write when the last ingredient has been removed. */
    const [updated] =
      rows.length === 0
        ? await db.batch([update, clear])
        : await db.batch([
            update,
            clear,
            db
              .insert(recipeIngredients)
              .values(rows.map(row => ({...row, recipeId: id}))),
          ])

    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    if (!isMissingReference(error)) throw error
    /* Two ways to get here: an ingredient that has gone, or the recipe
       itself. The insert names both, so which one it was takes another look. */
    return {
      ok: false,
      reason: (await exists(id)) ? 'ingredient-gone' : 'not-found',
    }
  }
}
