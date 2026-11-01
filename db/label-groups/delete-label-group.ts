import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {labelGroups} from '@/db/schema'

export type DeleteResult = {ok: true} | {ok: false; reason: 'not-found'}

/**
 * Cascades twice: into its labels, and from each of those into recipe_labels.
 * A group with labels on it takes them off every recipe, so the confirmation
 * has to say how many labels are going.
 */
export async function deleteLabelGroup(id: string): Promise<DeleteResult> {
  const deleted = await db
    .delete(labelGroups)
    .where(eq(labelGroups.id, id))
    .returning({id: labelGroups.id})

  return deleted[0] ? {ok: true} : {ok: false, reason: 'not-found'}
}
