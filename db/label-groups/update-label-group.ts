import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {isDuplicate} from '@/db/constraints'
import {labelGroups} from '@/db/schema'
import type {LabelGroupInput} from '@/lib/validation/label'

export type UpdateResult =
  | {ok: true}
  | {ok: false; reason: 'duplicate-name' | 'not-found'}

export async function updateLabelGroup(
  id: string,
  input: LabelGroupInput,
): Promise<UpdateResult> {
  try {
    const updated = await db
      .update(labelGroups)
      .set(input)
      .where(eq(labelGroups.id, id))
      .returning({id: labelGroups.id})

    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    throw error
  }
}
