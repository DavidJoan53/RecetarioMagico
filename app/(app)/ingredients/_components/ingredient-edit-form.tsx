'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useToast} from '@/components/toast-provider'
import type {Ingredient} from '@/db/schema'
import {queryKeys} from '@/lib/query-keys'
import {type FormState, updateIngredientAction} from '../actions'
import {IngredientFields} from './ingredient-fields'

type Props = {
  ingredient: Ingredient
  onDone: () => void
  onCancel: () => void
}

export function IngredientEditForm({ingredient, onDone, onCancel}: Props) {
  const t = useTranslations('ingredients')
  const queryClient = useQueryClient()
  const toast = useToast()

  /* The list reads its own cache, so a renamed ingredient has to be asked
     for again rather than revalidated on the server. */
  const saveThen = async (previous: FormState, form: FormData) => {
    const result = await updateIngredientAction(previous, form)
    if (result.done) {
      await queryClient.invalidateQueries({queryKey: queryKeys.ingredients})
    }
    /* The row was deleted from somewhere else while this form was open.
       Nothing typed here is wrong, so there is no field to point at. */
    if (result.error === 'gone') {
      toast({message: t('gone'), tone: 'error'})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(saveThen, {})
  const [name, setName] = useState(ingredient.name)
  const [photoUrl, setPhotoUrl] = useState(ingredient.photoUrl ?? '')
  const nameRef = useRef<HTMLInputElement>(null)
  const messageId = useId()

  const fieldError =
    state.error === 'duplicateName'
      ? 'duplicate'
      : state.error === 'invalid'
        ? 'invalid'
        : null

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
        errorId={fieldError ? messageId : undefined}
      />

      {/* Both about the name field, and bound to it. */}
      {fieldError && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(fieldError)}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
