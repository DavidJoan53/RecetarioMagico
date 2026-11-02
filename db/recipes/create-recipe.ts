import {db} from '@/db'
import {isDuplicate, isMissingReference} from '@/db/constraints'
import {recipeIngredients, recipes} from '@/db/schema'
import {uuidV7} from '@/lib/uuid'
import type {RecipeInput} from '@/lib/validation/recipe'
import {deriveImageUrl} from '@/lib/youtube'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name' | 'ingredient-gone'}

/**
 * The thumbnail is derived here so every write path gets it, not just the form.
 *
 * The id is minted rather than defaulted: both statements go in one batch, and
 * a batch cannot feed the recipe's returned id to the insert that needs it.
 * A recipe holding half its ingredients is worse than one that failed.
 */
export async function createRecipe(input: RecipeInput): Promise<CreateResult> {
  const {ingredients: rows, ...recipe} = input
  const id = uuidV7()

  const insertRecipe = db
    .insert(recipes)
    .values({...recipe, id, imageUrl: deriveImageUrl(recipe.links)})

  try {
    /* Drizzle refuses an insert with no values, and a recipe may legitimately
       have no ingredients yet. */
    if (rows.length === 0) await insertRecipe
    else {
      await db.batch([
        insertRecipe,
        db
          .insert(recipeIngredients)
          .values(rows.map(row => ({...row, recipeId: id}))),
      ])
    }
    return {ok: true, id}
  } catch (error) {
    /* The name is the only unique column a write can collide on here: the
       repeated ingredient the other index catches is rejected by the schema
       long before this. */
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    /* The recipe is new, so the only row that can be missing is an ingredient
       deleted while the form was open. */
    if (isMissingReference(error)) return {ok: false, reason: 'ingredient-gone'}
    throw error
  }
}
