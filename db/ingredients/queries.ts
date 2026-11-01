import {asc, eq, getTableColumns, sql} from 'drizzle-orm'
import {db} from '@/db'
import {ingredients, pantry} from '@/db/schema'

export type IngredientWithPantry = typeof ingredients.$inferSelect & {
  inPantry: boolean
}

/**
 * Alphabetical, not newest first: this list is scanned to find a name.
 *
 * The pantry flag is joined rather than fetched per row — the toggle needs it
 * on every line, and asking separately would be a query per ingredient.
 */
export async function allIngredients(): Promise<IngredientWithPantry[]> {
  return db
    .select({
      ...getTableColumns(ingredients),
      inPantry: sql<boolean>`${pantry.ingredientId} is not null`,
    })
    .from(ingredients)
    .leftJoin(pantry, eq(pantry.ingredientId, ingredients.id))
    .orderBy(asc(ingredients.name))
}
