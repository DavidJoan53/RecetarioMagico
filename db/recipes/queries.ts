import {and, desc, ilike, lt} from 'drizzle-orm'
import {db} from '@/db'
import {recipes} from '@/db/schema'
import {pageOf} from '@/lib/validation/page'

/** One ordering, one cursor: the list and the picker read the same rows. */
function recipeRows({
  after,
  limit,
  query,
}: {
  after: string | null
  limit: number
  query: string
}) {
  return db
    .select()
    .from(recipes)
    .where(
      and(
        query ? ilike(recipes.name, `%${query}%`) : undefined,
        after ? lt(recipes.id, after) : undefined,
      ),
    )
    .orderBy(desc(recipes.id))
    .limit(limit)
}

/** Keyset, not OFFSET: uuid v7 sorts chronologically and does not drift. */
export async function latestRecipes(limit: number, before?: string) {
  return recipeRows({after: before ?? null, limit, query: ''})
}

export type Recipe = typeof recipes.$inferSelect

export type RecipePage = {
  items: Recipe[]
  /** The id of the last recipe on the page, or null at the end. */
  nextCursor: string | null
}

/**
 * The same list, a page at a time. The cursor is the last id read: v7 ids
 * sort by when they were made, so "older than this one" is exactly where to
 * continue — and a recipe created while you read cannot push a row onto a
 * page already passed, the way an OFFSET would.
 *
 * A name narrows it without changing any of that: the order is still by id,
 * so the cursor means the same thing filtered or not.
 */
export async function recipesPage({
  after,
  limit,
  query = '',
}: {
  after: string | null
  limit: number
  query?: string
}): Promise<RecipePage> {
  const rows = await recipeRows({after, limit: limit + 1, query})
  return pageOf(rows, limit, row => row.id)
}
