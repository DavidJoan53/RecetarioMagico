import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {isMissingReference} from '@/db/constraints'
import {dinnerRecipes, dinners} from '@/db/schema'
import type {DinnerInput} from '@/lib/validation/dinner'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'recipe-gone'}

/**
 * The id is asked for before the write rather than read back from it. The
 * HTTP driver has no interactive transactions, only a batch of statements
 * sent together, and a batch cannot use what an earlier statement returned —
 * so knowing the id up front is what lets the dinner and its recipes land or
 * fail as one. Without it a failed second statement leaves a dinner that
 * records nothing.
 */
async function nextId(): Promise<string> {
  const rows = await db.execute<{id: string}>(sql`select uuidv7() as id`)
  const id = rows.rows[0]?.id
  if (!id) throw new Error('no id')
  return id
}

export async function createDinner(input: DinnerInput): Promise<CreateResult> {
  const id = await nextId()

  try {
    await db.batch([
      db
        .insert(dinners)
        .values({id, eatenAt: input.eatenAt, notes: input.notes}),
      db.insert(dinnerRecipes).values(
        input.recipeIds.map(recipeId => ({
          dinnerId: id,
          recipeId,
        })),
      ),
    ])
    return {ok: true, id}
  } catch (error) {
    /* A recipe deleted while the form was open. The batch rolled back, so
       there is no half-written dinner to clean up. */
    if (isMissingReference(error)) return {ok: false, reason: 'recipe-gone'}
    throw error
  }
}
