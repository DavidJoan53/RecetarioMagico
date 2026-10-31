import {desc, lt} from 'drizzle-orm'
import {db} from '@/db'
import {recipes} from '@/db/schema'

/** Keyset, not OFFSET: uuid v7 sorts chronologically and does not drift. */
export async function latestRecipes(limit: number, before?: string) {
  return db
    .select()
    .from(recipes)
    .where(before ? lt(recipes.id, before) : undefined)
    .orderBy(desc(recipes.id))
    .limit(limit)
}
