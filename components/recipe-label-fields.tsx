'use client'

import Link from 'next/link'
import {useTranslations} from 'next-intl'
import type {Label} from '@/db/schema'
import type {GroupWithLabels} from '@/lib/labels'
import {LabelChip} from './label-chip'

type Props = {
  groups: readonly GroupWithLabels[]
  /** What the recipe already carries. Empty when creating. */
  initial?: readonly Label[]
}

/**
 * The labels a recipe carries, as one checkbox per label. Every ticked box
 * submits `labelId`, so FormData.getAll returns the set.
 *
 * Checkboxes rather than toggle buttons: ticking things off a list is what a
 * checkbox is, and it carries its own state and accessible name without ARIA.
 */
export function RecipeLabelFields({groups, initial = []}: Props) {
  const t = useTranslations('recipeForm')
  const chosen = new Set(initial.map(label => label.id))

  /* Empty groups are left out: a heading over nothing reads as a label that
     failed to load, when what is missing is the group's first label. */
  const withLabels = groups.filter(group => group.labels.length > 0)

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-semibold text-secondary-foreground text-xs uppercase tracking-wider">
        {t('labels')}
      </legend>

      {withLabels.length === 0 ? (
        <p className="text-secondary-foreground text-sm">
          {t('noLabels')}{' '}
          <Link href="/labels" className="font-semibold text-primary-strong">
            {t('goToLabels')}
          </Link>
        </p>
      ) : (
        withLabels.map(group => (
          /* Nested: the outer legend says these are labels, this one says
             which group, and both are read on the way into a box. */
          <fieldset key={group.id} className="flex flex-col gap-2">
            <legend className="font-semibold text-sm">{group.name}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {group.labels.map(label => (
                /* The chip is the label's name, so the box is named by it
                   and needs nothing of its own. */
                <label
                  key={label.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="labelId"
                    value={label.id}
                    defaultChecked={chosen.has(label.id)}
                    className="size-4 accent-primary-strong"
                  />
                  <LabelChip label={label} />
                </label>
              ))}
            </div>
          </fieldset>
        ))
      )}
    </fieldset>
  )
}
