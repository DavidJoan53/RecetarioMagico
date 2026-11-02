import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {dinners} from '@/db/schema'

export type DeleteResult = {ok: true} | {ok: false; reason: 'not-found'}

/**
 * Nothing refuses: dinner_recipes is ON DELETE CASCADE and holds only the
 * pairing, so the recipes themselves are untouched. One statement is enough.
 */
export async function deleteDinner(id: string): Promise<DeleteResult> {
  const deleted = await db
    .delete(dinners)
    .where(eq(dinners.id, id))
    .returning({id: dinners.id})

  return deleted[0] ? {ok: true} : {ok: false, reason: 'not-found'}
}
