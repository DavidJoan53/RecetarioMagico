import {db} from '@/db'
import {isDuplicate, isStillReferenced} from '@/db/constraints'
import {labels} from '@/db/schema'
import type {LabelInput} from '@/lib/validation/label'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name' | 'no-group'}

/**
 * A name is unique across every group, not within one — so "Pollo" cannot sit
 * in two. The message has to say that rather than blame the group.
 */
export async function createLabel(input: LabelInput): Promise<CreateResult> {
  try {
    const inserted = await db
      .insert(labels)
      .values(input)
      .onConflictDoNothing({target: labels.name})
      .returning({id: labels.id})

    const row = inserted[0]
    return row ? {ok: true, id: row.id} : {ok: false, reason: 'duplicate-name'}
  } catch (error) {
    /* The group was deleted between the page rendering and this submit. */
    if (isStillReferenced(error)) return {ok: false, reason: 'no-group'}
    if (isDuplicate(error)) return {ok: false, reason: 'duplicate-name'}
    throw error
  }
}
