import {asc, eq} from 'drizzle-orm'
import {db} from '@/db'
import {labelGroups, labels} from '@/db/schema'
import {type GroupWithLabels, groupByGroup} from '@/lib/labels'

/**
 * One query, not one per group. The join is left so a group with no labels
 * still comes back — which is the state every group starts in.
 */
export async function allGroupsWithLabels(): Promise<GroupWithLabels[]> {
  const rows = await db
    .select({group: labelGroups, label: labels})
    .from(labelGroups)
    .leftJoin(labels, eq(labels.labelGroupId, labelGroups.id))
    .orderBy(asc(labelGroups.name), asc(labels.name))

  return groupByGroup(rows)
}
