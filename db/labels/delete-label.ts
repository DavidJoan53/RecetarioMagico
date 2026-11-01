import {count, eq} from 'drizzle-orm'
import {db} from '@/db'
import {labels, recipeLabels} from '@/db/schema'

export type DeleteResult = {ok: true} | {ok: false; reason: 'not-found'}

/**
 * recipe_labels is ON DELETE CASCADE, so this always succeeds and quietly
 * takes the label off every recipe carrying it. Nothing refuses, which is why
 * the count has to be shown before the user agrees rather than after.
 */
export async function deleteLabel(id: string): Promise<DeleteResult> {
  const deleted = await db
    .delete(labels)
    .where(eq(labels.id, id))
    .returning({id: labels.id})

  return deleted[0] ? {ok: true} : {ok: false, reason: 'not-found'}
}

export async function recipesUsingLabel(id: string): Promise<number> {
  const rows = await db
    .select({n: count()})
    .from(recipeLabels)
    .where(eq(recipeLabels.labelId, id))
  return rows[0]?.n ?? 0
}
