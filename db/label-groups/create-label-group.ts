import {db} from '@/db'
import {labelGroups} from '@/db/schema'
import type {LabelGroupInput} from '@/lib/validation/label'

export type CreateResult =
  | {ok: true; id: string}
  | {ok: false; reason: 'duplicate-name'}

export async function createLabelGroup(
  input: LabelGroupInput,
): Promise<CreateResult> {
  const inserted = await db
    .insert(labelGroups)
    .values(input)
    .onConflictDoNothing({target: labelGroups.name})
    .returning({id: labelGroups.id})

  const row = inserted[0]
  return row ? {ok: true, id: row.id} : {ok: false, reason: 'duplicate-name'}
}
