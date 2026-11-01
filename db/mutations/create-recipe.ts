import {db} from '@/db'
import {recipes} from '@/db/schema'
import type {RecipeInput} from '@/lib/validation/recipe'
import {deriveImageUrl} from '@/lib/youtube'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name'}

/** The thumbnail is derived here so every write path gets it, not just the form. */
export async function createRecipe(input: RecipeInput): Promise<CreateResult> {
  const inserted = await db
    .insert(recipes)
    .values({...input, imageUrl: deriveImageUrl(input.links)})
    .onConflictDoNothing({target: recipes.name})
    .returning({id: recipes.id})

  const row = inserted[0]
  return row ? {ok: true, id: row.id} : {ok: false, reason: 'duplicate-name'}
}
