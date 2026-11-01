import type {Label, LabelGroup} from '@/db/schema'

export type GroupWithLabels = LabelGroup & {labels: Label[]}

/** A left join repeats the group per label, and gives one null row when empty. */
type Row = {group: LabelGroup; label: Label | null}

/**
 * Pure, so it is tested without a database — the query module pulls in the
 * client, which validates the environment on import.
 */
export function groupByGroup(rows: Row[]): GroupWithLabels[] {
  const groups = new Map<string, GroupWithLabels>()

  for (const {group, label} of rows) {
    const existing = groups.get(group.id) ?? {...group, labels: []}
    if (label) existing.labels.push(label)
    groups.set(group.id, existing)
  }

  return [...groups.values()]
}
