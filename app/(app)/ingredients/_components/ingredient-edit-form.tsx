'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {Ingredient} from '@/db/schema'
import {updateIngredientAction} from '../actions'
import {IngredientFields} from './ingredient-fields'

type Props = {
  ingredient: Ingredient
  onDone: () => void
  onCancel: () => void
}

export function IngredientEditForm({ingredient, onDone, onCancel}: Props) {
  const t = useTranslations('ingredients')
  const [state, formAction, pending] = useActionState(
    updateIngredientAction,
    {},
  )
  const [name, setName] = useState(ingredient.name)
  const [photoUrl, setPhotoUrl] = useState(ingredient.photoUrl ?? '')
  const nameRef = useRef<HTMLInputElement>(null)
  const messageId = useId()

  /** The row became a form; say where you are rather than moving silently. */
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])

  return (
    <form
      action={formAction}
      aria-label={t('editTitle', {name: ingredient.name})}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={ingredient.id} />

      <IngredientFields
        name={name}
        photoUrl={photoUrl}
        onName={setName}
        onPhotoUrl={setPhotoUrl}
        nameRef={nameRef}
        errorId={state.error ? messageId : undefined}
      />

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(
            state.error === 'duplicateName'
              ? 'duplicate'
              : state.error === 'gone'
                ? 'gone'
                : 'invalid',
          )}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
