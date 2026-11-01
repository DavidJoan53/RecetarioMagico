import {db} from '@/db'
import {ingredients} from '@/db/schema'
import type {IngredientInput} from '@/lib/validation/ingredient'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name'}

export async function createIngredient(
  input: IngredientInput,
): Promise<CreateResult> {
  const inserted = await db
    .insert(ingredients)
    .values(input)
    .onConflictDoNothing({target: ingredients.name})
    .returning({id: ingredients.id})

  const row = inserted[0]
  return row ? {ok: true, id: row.id} : {ok: false, reason: 'duplicate-name'}
}
