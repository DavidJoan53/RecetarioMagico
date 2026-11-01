'use client'

import Link from 'next/link'
import {useTranslations} from 'next-intl'
import {useActionState, useId} from 'react'
import type {FormState} from '@/app/(app)/recipes/actions'
import {FieldList} from './field-list'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
  submitLabel: string
}

export function RecipeForm({action, submitLabel}: Props) {
  const t = useTranslations('recipeForm')
  const [state, formAction, pending] = useActionState(action, {})
  const nameId = useId()
  const errorId = useId()
  const minutesId = useId()

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        /* Announced rather than only coloured: an alert reaches a screen
           reader without the user having to go looking for it. */
        <p
          role="alert"
          id={errorId}
          className="rounded-lg border border-primary-strong px-3 py-2 text-primary-strong text-sm"
        >
          {state.error === 'duplicateName' ? t('duplicateName') : t('invalid')}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={nameId}>
          {t('name')}
        </label>
        <input
          id={nameId}
          name="name"
          required
          maxLength={200}
          placeholder={t('namePlaceholder')}
          aria-describedby={state.error ? errorId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={minutesId}>
          {t('minutes')}
        </label>
        <input
          id={minutesId}
          name="prepTimeMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          className="w-28 rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

      <FieldList
        name="instructions"
        legend={t('instructions')}
        itemLabel={n => t('step', {n})}
        removeLabel={n => t('removeStep', {n})}
        addLabel={t('addStep')}
      />

      <FieldList
        name="links"
        legend={t('links')}
        itemLabel={n => t('link', {n})}
        removeLabel={n => t('removeLink', {n})}
        addLabel={t('addLink')}
        placeholder={t('linkPlaceholder')}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary-strong px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <Link
          href="/recipes"
          className="rounded-lg border border-secondary-foreground px-4 py-3 text-center font-semibold text-sm"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  )
}
