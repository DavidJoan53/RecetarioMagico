import {eq} from 'drizzle-orm'
import type {BatchItem} from 'drizzle-orm/batch'
import {db} from '@/db'
import {isDuplicate, isMissingReference} from '@/db/constraints'
import {anyLabelMissing} from '@/db/labels/queries'
import {recipeIngredients, recipeLabels, recipes} from '@/db/schema'
import type {RecipeInput} from '@/lib/validation/recipe'
import {deriveImageUrl} from '@/lib/youtube'

export type UpdateResult =
  | {ok: true}
  | {
      ok: false
      reason: 'not-found' | 'duplicate-name' | 'ingredient-gone' | 'label-gone'
    }

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
  const {ingredients: rows, labelIds, ...recipe} = input

  const update = db
    .update(recipes)
    .set({...recipe, imageUrl: deriveImageUrl(recipe.links)})
    .where(eq(recipes.id, id))
    .returning({id: recipes.id})

  /* Both sets are cleared whether or not anything replaces them: emptying
     one is a save like any other. Drizzle refuses an insert with no values,
     so only the refills are conditional. */
  const writes: BatchItem<'pg'>[] = [
    db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id)),
    db.delete(recipeLabels).where(eq(recipeLabels.recipeId, id)),
  ]
  if (rows.length > 0) {
    writes.push(
      db
        .insert(recipeIngredients)
        .values(rows.map(row => ({...row, recipeId: id}))),
    )
  }
  if (labelIds.length > 0) {
    writes.push(
      db
        .insert(recipeLabels)
        .values(labelIds.map(labelId => ({recipeId: id, labelId}))),
    )
  }

  try {
    const [updated] = await db.batch([update, ...writes])
    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    if (!isMissingReference(error)) throw error
    /* Three ways to get here: the recipe itself has gone, or one of the
       things the form picked has. The inserts name all of them, so which it
       was takes another look — and each needs different words. */
    if (!(await exists(id))) return {ok: false, reason: 'not-found'}
    return {
      ok: false,
      reason: (await anyLabelMissing(labelIds))
        ? 'label-gone'
        : 'ingredient-gone',
    }
  }
}
