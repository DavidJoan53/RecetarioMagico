import {asc, eq} from 'drizzle-orm'
import {db} from '@/db'
import {ingredients, pantry} from '@/db/schema'

export type PantryItem = {
  ingredientId: string
  name: string
  photoUrl: string | null
  quantity: number | null
  unit: (typeof pantry.unit.enumValues)[number] | null
}

/**
 * Inner join: a pantry row without its ingredient cannot exist, the foreign
 * key sees to that. Alphabetical, because this list is read to check whether
 * something is in it.
 */
export async function pantryItems(): Promise<PantryItem[]> {
  return db
    .select({
      ingredientId: pantry.ingredientId,
      name: ingredients.name,
      photoUrl: ingredients.photoUrl,
      quantity: pantry.quantity,
      unit: pantry.unit,
    })
    .from(pantry)
    .innerJoin(ingredients, eq(ingredients.id, pantry.ingredientId))
    .orderBy(asc(ingredients.name))
}
