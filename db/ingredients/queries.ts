import {asc} from 'drizzle-orm'
import {db} from '@/db'
import {ingredients} from '@/db/schema'

/** Alphabetical, not newest first: this list is scanned to find a name. */
export async function allIngredients() {
  return db.select().from(ingredients).orderBy(asc(ingredients.name))
}
