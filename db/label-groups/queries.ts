import {asc, eq, sql} from 'drizzle-orm'
import {db} from '@/db'
import {labelGroups, labels, recipeLabels} from '@/db/schema'
import {type GroupWithLabels, groupByGroup} from '@/lib/labels'

/**
 * One query, not one per group. The join is left so a group with no labels
 * still comes back — which is the state every group starts in.
 *
 * The usage count rides along because deleting a label cascades into recipes
 * without refusing: the number has to be on screen before the user agrees,
 * and asking for it per label would be a request per chip.
 */
export async function allGroupsWithLabels(): Promise<GroupWithLabels[]> {
  const rows = await db
    .select({
      group: labelGroups,
      label: labels,
      recipeCount: sql<number>`(
        select count(*)::int from ${recipeLabels}
        where ${recipeLabels.labelId} = ${labels.id}
      )`,
    })
    .from(labelGroups)
    .leftJoin(labels, eq(labels.labelGroupId, labelGroups.id))
    .orderBy(asc(labelGroups.name), asc(labels.name))

  return groupByGroup(rows)
}
