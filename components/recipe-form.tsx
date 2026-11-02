'use client'

import {useRouter} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {useActionState, useId} from 'react'
import type {FormState} from '@/app/(app)/recipes/actions'
import type {RecipeWithIngredients} from '@/db/recipes/queries'
import {FieldList} from './field-list'
import {RecipeIngredientFields} from './recipe-ingredient-fields'
import {useToast} from './toast-provider'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
  submitLabel: string
  /** Absent when creating. Present, it is what every field starts as. */
  recipe?: RecipeWithIngredients
}

export function RecipeForm({action, submitLabel, recipe}: Props) {
  const t = useTranslations('recipeForm')
  const toast = useToast()
  const router = useRouter()

  /* Neither is about a field. "gone" means the recipe was deleted while this
     was open; "ingredientGone" means one of the picked ingredients was. */
  const saveThen = async (previous: FormState, form: FormData) => {
    const result = await action(previous, form)
    if (result.error === 'gone' || result.error === 'ingredientGone') {
      toast({message: t(result.error), tone: 'error'})
    }
    if (result.done) {
      toast({message: recipe ? t('saved') : t('created')})
      /* Creating lands on the list; saving goes back to the recipe. Pushed
         from here rather than redirected from the action, so the toast
         raised a line above survives the navigation. */
      router.push(recipe ? `/recipes/${recipe.id}` : '/recipes')
    }
    return result
  }

  const [state, formAction, pending] = useActionState(saveThen, {})
  const nameId = useId()
  const errorId = useId()
  const minutesId = useId()

  /* Only the name field is told it is invalid, so a message about an
     ingredient must not point at it. */
  const nameIsAtFault =
    state.error === 'duplicateName' || state.error === 'invalid'

  /* What is left for the form to say: the two above, plus an ingredient
     picked twice, which is about the rows rather than the name. */
  const fieldError =
    state.error && state.error !== 'gone' && state.error !== 'ingredientGone'
      ? state.error
      : null

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Which recipe is being saved. Absent when creating, which is what
          tells the action the two apart. */}
      {recipe && <input type="hidden" name="id" value={recipe.id} />}

      {fieldError && (
        /* Announced rather than only coloured: an alert reaches a screen
           reader without the user having to go looking for it. */
        <p
          role="alert"
          id={errorId}
          className="rounded-lg border border-primary-strong px-3 py-2 text-primary-strong text-sm"
        >
          {t(fieldError)}
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

      {/* One button, full width. The way out is the arrow in the page
          header, so there is nothing to sit beside. */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary-strong px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  )
}
