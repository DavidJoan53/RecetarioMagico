import {eq} from 'drizzle-orm'
import {db} from '@/db'
import {isDuplicate} from '@/db/constraints'
import {labels} from '@/db/schema'
import type {LabelInput} from '@/lib/validation/label'

export type UpdateResult =
  | {ok: true}
  | {ok: false; reason: 'duplicate-name' | 'not-found'}

export async function updateLabel(
  id: string,
  input: LabelInput,
): Promise<UpdateResult> {
  try {
    const updated = await db
      .update(labels)
      .set(input)
      .where(eq(labels.id, id))
      .returning({id: labels.id})

    return updated[0] ? {ok: true} : {ok: false, reason: 'not-found'}
  } catch (error) {
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    throw error
  }
}
