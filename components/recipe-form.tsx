'use client'

import Link from 'next/link'
import {useTranslations} from 'next-intl'
import {useActionState, useId} from 'react'
import type {FormState} from '@/app/(app)/recipes/actions'
import type {RecipeWithIngredients} from '@/db/recipes/queries'
import {FieldList} from './field-list'
import {RecipeIngredientFields} from './recipe-ingredient-fields'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
  submitLabel: string
  /** Absent when creating. Present, it is what every field starts as. */
  recipe?: RecipeWithIngredients
}

export function RecipeForm({action, submitLabel, recipe}: Props) {
  const t = useTranslations('recipeForm')
  const [state, formAction, pending] = useActionState(action, {})
  const nameId = useId()
  const errorId = useId()
  const minutesId = useId()

  /* Only the name field is told it is invalid, so a message about an
     ingredient must not point at it. */
  const nameIsAtFault =
    state.error === 'duplicateName' || state.error === 'invalid'

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Which recipe is being saved. Absent when creating, which is what
          tells the action the two apart. */}
      {recipe && <input type="hidden" name="id" value={recipe.id} />}

      {state.error && (
        /* Announced rather than only coloured: an alert reaches a screen
           reader without the user having to go looking for it. */
        <p
          role="alert"
          id={errorId}
          className="rounded-lg border border-primary-strong px-3 py-2 text-primary-strong text-sm"
        >
          {t(state.error)}
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
          defaultValue={recipe?.name}
          placeholder={t('namePlaceholder')}
          aria-describedby={nameIsAtFault ? errorId : undefined}
          aria-invalid={nameIsAtFault ? true : undefined}
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
          defaultValue={recipe?.prepTimeMinutes ?? ''}
          className="w-28 rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

      <RecipeIngredientFields initial={recipe?.ingredients} />

      <FieldList
        name="instructions"
        legend={t('instructions')}
        itemLabel={n => t('step', {n})}
        removeLabel={n => t('removeStep', {n})}
        addLabel={t('addStep')}
        initialValues={recipe?.instructions}
      />

      <FieldList
        name="links"
        legend={t('links')}
        itemLabel={n => t('link', {n})}
        removeLabel={n => t('removeLink', {n})}
        addLabel={t('addLink')}
        placeholder={t('linkPlaceholder')}
        initialValues={recipe?.links}
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
          href={recipe ? `/recipes/${recipe.id}` : '/recipes'}
          className="rounded-lg border border-secondary-foreground px-4 py-3 text-center font-semibold text-sm"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  )
}
