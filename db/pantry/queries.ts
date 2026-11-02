import {and, asc, eq, gt} from 'drizzle-orm'
import {db} from '@/db'
import {ingredients, pantry} from '@/db/schema'
import {pageOf} from '@/lib/validation/page'

export type PantryItem = {
  ingredientId: string
  name: string
  photoUrl: string | null
  quantity: number | null
  unit: (typeof pantry.unit.enumValues)[number] | null
}

export type PantryPage = {
  items: PantryItem[]
  /** The last name on the page, or null when there is no next one. */
  nextCursor: string | null
}

/**
 * Inner join: a pantry row without its ingredient cannot exist, the foreign
 * key sees to that. Alphabetical, because this list is read to check whether
 * something is in it.
 *
 * Keyset on the name for the same reason the ingredient search is: names are
 * unique and the order follows them, so the last one read says exactly where
 * to continue, and something added while you scroll cannot push a row onto a
 * page already passed.
 */
export async function pantryPage({
  after,
  limit,
}: {
  after: string | null
  limit: number
}): Promise<PantryPage> {
  const rows = await db
    .select({
      ingredientId: pantry.ingredientId,
      name: ingredients.name,
      photoUrl: ingredients.photoUrl,
      quantity: pantry.quantity,
      unit: pantry.unit,
    })
    .from(pantry)
    .innerJoin(ingredients, eq(ingredients.id, pantry.ingredientId))
    .where(and(after ? gt(ingredients.name, after) : undefined))
    .orderBy(asc(ingredients.name))
    .limit(limit + 1)

  return pageOf(rows, limit, row => row.name)
}
