import {and, asc, eq, getTableColumns, gt, ilike, sql} from 'drizzle-orm'
import {db} from '@/db'
import {ingredients, pantry} from '@/db/schema'

export type IngredientWithPantry = typeof ingredients.$inferSelect & {
  inPantry: boolean
}

/** Alphabetical, not newest first: this list is scanned to find a name. */
export async function allIngredients() {
  return db.select().from(ingredients).orderBy(asc(ingredients.name))
}

/**
 * The same list, for choosing what you have. The flag is joined rather than
 * asked per row — every line needs it, and separately would be one request
 * per ingredient for a boolean.
 */
export async function allIngredientsWithPantry(): Promise<
  IngredientWithPantry[]
> {
  return db
    .select({
      ...getTableColumns(ingredients),
      inPantry: sql<boolean>`${pantry.ingredientId} is not null`,
    })
    .from(ingredients)
    .leftJoin(pantry, eq(pantry.ingredientId, ingredients.id))
    .orderBy(asc(ingredients.name))
}

export type IngredientPage = {
  items: IngredientWithPantry[]
  /** The last name on the page, or null when there is no next one. */
  nextCursor: string | null
}

/**
 * Keyset on name, not OFFSET. The list is alphabetical and names are unique,
 * so the last name read is a complete description of where to continue — and
 * one added while scrolling cannot shift a row onto a page already seen.
 */
export async function searchIngredients({
  query,
  after,
  limit,
}: {
  query: string
  after: string | null
  limit: number
}): Promise<IngredientPage> {
  const rows = await db
    .select({
      ...getTableColumns(ingredients),
      inPantry: sql<boolean>`${pantry.ingredientId} is not null`,
    })
    .from(ingredients)
    .leftJoin(pantry, eq(pantry.ingredientId, ingredients.id))
    .where(
      and(
        query ? ilike(ingredients.name, `%${query}%`) : undefined,
        after ? gt(ingredients.name, after) : undefined,
      ),
    )
    .orderBy(asc(ingredients.name))
    .limit(limit + 1)

  /* One extra row answers "is there more" without a second count query. */
  const items = rows.slice(0, limit)
  const last = items.at(-1)
  return {items, nextCursor: rows.length > limit && last ? last.name : null}
}
