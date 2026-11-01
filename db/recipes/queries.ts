import {desc, lt} from 'drizzle-orm'
import {db} from '@/db'
import {recipes} from '@/db/schema'
import {pageOf} from '@/lib/validation/page'

/** Keyset, not OFFSET: uuid v7 sorts chronologically and does not drift. */
export async function latestRecipes(limit: number, before?: string) {
  return db
    .select()
    .from(recipes)
    .where(before ? lt(recipes.id, before) : undefined)
    .orderBy(desc(recipes.id))
    .limit(limit)
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
 */
export async function recipesPage({
  after,
  limit,
}: {
  after: string | null
  limit: number
}): Promise<RecipePage> {
  const rows = await latestRecipes(limit + 1, after ?? undefined)
  return pageOf(rows, limit, row => row.id)
}
