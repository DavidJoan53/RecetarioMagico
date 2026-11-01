import type {Label, LabelGroup} from '@/db/schema'

/** How many recipes carry it — the warning a cascading delete needs. */
export type LabelWithUsage = Label & {recipeCount: number}

export type GroupWithLabels = LabelGroup & {labels: LabelWithUsage[]}

/** A left join repeats the group per label, and gives one null row when empty. */
type Row = {group: LabelGroup; label: Label | null; recipeCount: number | null}

/**
 * Pure, so it is tested without a database — the query module pulls in the
 * client, which validates the environment on import.
 */
export function groupByGroup(rows: Row[]): GroupWithLabels[] {
  const groups = new Map<string, GroupWithLabels>()

  for (const {group, label, recipeCount} of rows) {
    const existing = groups.get(group.id) ?? {...group, labels: []}
    if (label) existing.labels.push({...label, recipeCount: recipeCount ?? 0})
    groups.set(group.id, existing)
  }

  return [...groups.values()]
}
