import {getTranslations} from 'next-intl/server'
import {LabelChip} from '@/components/label-chip'
import {allGroupsWithLabels} from '@/db/label-groups/queries'
import {NewLabelForm} from './new-label-form'

export async function GroupList() {
  const t = await getTranslations('labels')
  const groups = await allGroupsWithLabels()

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(group => (
        <section
          key={group.id}
          aria-labelledby={`group-${group.id}`}
          className="flex flex-col gap-3 rounded-lg border border-light bg-background-foreground p-4"
        >
          <h2
            id={`group-${group.id}`}
            className="font-mono text-secondary-foreground text-xs uppercase tracking-wider"
          >
            {group.name}
          </h2>

          {group.labels.length === 0 ? (
            <p className="text-secondary-foreground text-sm">
              {t('groupEmpty')}
            </p>
          ) : (
            <ul aria-label={group.name} className="flex flex-wrap gap-2">
              {group.labels.map(label => (
                <li key={label.id}>
                  <LabelChip label={label} />
                </li>
              ))}
            </ul>
          )}

          <NewLabelForm groupId={group.id} groupName={group.name} />
        </section>
      ))}
    </div>
  )
}
