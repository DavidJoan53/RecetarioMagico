import {inArray} from 'drizzle-orm'
import {db} from '@/db'
import {labels} from '@/db/schema'

/**
 * Whether any of these labels has gone. A recipe write names two kinds of
 * row the user picked — ingredients and labels — so a foreign key failure
 * alone does not say which one was deleted while the form was open, and the
 * two need different words. Asked only on that failure path.
 */
export async function anyLabelMissing(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false

  const found = await db
    .select({id: labels.id})
    .from(labels)
    .where(inArray(labels.id, ids))
  return found.length < ids.length
}
