import {asc, eq, getTableColumns, sql} from 'drizzle-orm'
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
