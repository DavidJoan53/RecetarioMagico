import {getTranslations} from 'next-intl/server'
import {FocusCatcher} from '@/components/focus-catcher'
import {allGroupsWithLabels} from '@/db/label-groups/queries'
import {GroupHeader} from './group-header'
import {LabelItem} from './label-item'
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
    <FocusCatcher>
      <div className="flex flex-col gap-4">
        {groups.map(group => (
          <section
            key={group.id}
            aria-labelledby={`group-${group.id}`}
            className="flex flex-col gap-3 rounded-lg border border-light bg-background-foreground p-4"
          >
            <GroupHeader group={group} headingId={`group-${group.id}`} />

            {group.labels.length === 0 ? (
              <p className="text-secondary-foreground text-sm">
                {t('groupEmpty')}
              </p>
            ) : (
              <ul aria-label={group.name} className="flex flex-wrap gap-2">
                {group.labels.map(label => (
                  <LabelItem key={label.id} label={label} />
                ))}
              </ul>
            )}

            <NewLabelForm groupId={group.id} groupName={group.name} />
          </section>
        ))}
      </div>
    </FocusCatcher>
  )
}
