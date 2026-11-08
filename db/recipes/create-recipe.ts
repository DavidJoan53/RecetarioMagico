import type {BatchItem} from 'drizzle-orm/batch'
import {db} from '@/db'
import {isDuplicate, isMissingReference} from '@/db/constraints'
import {recipeIngredients, recipeLabels, recipes} from '@/db/schema'
import {uuidV7} from '@/lib/uuid'
import type {RecipeInput} from '@/lib/validation/recipe'
import {deriveImageUrl} from '@/lib/youtube'
import {anyLabelMissing} from './missing-label'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name' | 'ingredient-gone' | 'label-gone'}

/**
 * The thumbnail is derived here so every write path gets it, not just the form.
 *
 * The id is minted rather than defaulted: both statements go in one batch, and
 * a batch cannot feed the recipe's returned id to the insert that needs it.
 * A recipe holding half its ingredients is worse than one that failed.
 */
export async function createRecipe(input: RecipeInput): Promise<CreateResult> {
  const {ingredients: rows, labelIds, ...recipe} = input
  const id = uuidV7()

  const insertRecipe = db
    .insert(recipes)
    .values({...recipe, id, imageUrl: deriveImageUrl(recipe.links)})

  /* Drizzle refuses an insert with no values, and a recipe may legitimately
     have neither ingredients nor labels yet. */
  const sets: BatchItem<'pg'>[] = []
  if (rows.length > 0) {
    sets.push(
      db
        .insert(recipeIngredients)
        .values(rows.map(row => ({...row, recipeId: id}))),
    )
  }
  if (labelIds.length > 0) {
    sets.push(
      db
        .insert(recipeLabels)
        .values(labelIds.map(labelId => ({recipeId: id, labelId}))),
    )
  }

  try {
    if (sets.length === 0) await insertRecipe
    else await db.batch([insertRecipe, ...sets])
    return {ok: true, id}
  } catch (error) {
    /* The name is the only unique column a write can collide on here: the
       repeated ingredient the other index catches is rejected by the schema
       long before this, and the label ids arrive deduplicated. */
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    if (!isMissingReference(error)) throw error
    /* The recipe is new, so what has gone is something the form picked —
       an ingredient or a label. Which one decides the wording. */
    return {
      ok: false,
      reason: (await anyLabelMissing(labelIds))
        ? 'label-gone'
        : 'ingredient-gone',
    }
  }
}
