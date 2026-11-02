import {and, asc, desc, eq, inArray, lt, or} from 'drizzle-orm'
import {db} from '@/db'
import {dinnerRecipes, dinners, recipes} from '@/db/schema'
import {
  attachRecipes,
  type DinnerCursor,
  type DinnerListItem,
  type DinnerWithRecipes,
  encodeDinnerCursor,
  groupByDinner,
} from '@/lib/dinners'
import {pageOf} from '@/lib/validation/page'

/** Ordered by eatenAt, which can differ from insertion order. */
export async function latestDinners(
  limit: number,
  before?: Date,
): Promise<DinnerWithRecipes[]> {
  const rows = await db
    .select({
      id: dinners.id,
      eatenAt: dinners.eatenAt,
      notes: dinners.notes,
      recipeId: recipes.id,
      recipeName: recipes.name,
      recipeImage: recipes.imageUrl,
    })
    .from(dinners)
    .leftJoin(dinnerRecipes, eq(dinnerRecipes.dinnerId, dinners.id))
    .leftJoin(recipes, eq(recipes.id, dinnerRecipes.recipeId))
    .where(before ? lt(dinners.eatenAt, before) : undefined)
    .orderBy(desc(dinners.eatenAt))

  return groupByDinner(rows).slice(0, limit)
}

export type DinnerPage = {
  items: DinnerListItem[]
  /** Where to continue from, or null at the end. */
  nextCursor: string | null
}

/**
 * Two queries, not one join. A join returns a row per recipe, so a LIMIT on
 * it cuts a dinner in half at the page boundary and the half left behind is
 * never asked for again.
 *
 * Keyset on (eatenAt, id). eatenAt alone is not unique — two dinners on the
 * same evening would leave the cursor unable to say which of them was last,
 * and the page after them would repeat one and skip the other.
 */
export async function dinnersPage({
  after,
  limit,
}: {
  after: DinnerCursor | null
  limit: number
}): Promise<DinnerPage> {
  const rows = await db
    .select({id: dinners.id, eatenAt: dinners.eatenAt, notes: dinners.notes})
    .from(dinners)
    .where(
      after
        ? or(
            lt(dinners.eatenAt, after.eatenAt),
            and(eq(dinners.eatenAt, after.eatenAt), lt(dinners.id, after.id)),
          )
        : undefined,
    )
    .orderBy(desc(dinners.eatenAt), desc(dinners.id))
    .limit(limit + 1)

  const {items, nextCursor} = pageOf(rows, limit, encodeDinnerCursor)
  if (items.length === 0) return {items: [], nextCursor: null}

  const links = await db
    .select({
      dinnerId: dinnerRecipes.dinnerId,
      id: recipes.id,
      name: recipes.name,
      imageUrl: recipes.imageUrl,
    })
    .from(dinnerRecipes)
    .innerJoin(recipes, eq(recipes.id, dinnerRecipes.recipeId))
    .where(
      inArray(
        dinnerRecipes.dinnerId,
        items.map(row => row.id),
      ),
    )
    /** Alphabetical, so a dinner reads the same way twice running. */
    .orderBy(asc(recipes.name))

  return {items: attachRecipes(items, links), nextCursor}
}
