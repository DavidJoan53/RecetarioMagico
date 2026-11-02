'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useToast} from '@/components/toast-provider'
import {queryKeys} from '@/lib/query-keys'
import type {FormState} from '../actions'
import {IngredientFields} from './ingredient-fields'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
  /** Closes the form. It is opened from a plus — see add-ingredient. */
  onCancel: () => void
}

export function IngredientForm({action, onCancel}: Props) {
  const t = useTranslations('ingredients')
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const messageId = useId()
  const queryClient = useQueryClient()
  const toast = useToast()

  /**
   * Controlled on purpose. React resets an uncontrolled form after an action
   * whether it succeeded or not, so a rejected name would take what was typed
   * with it. Clearing is a thing that happens on success only.
   *
   * Cleared here rather than from an effect watching state.done — that is
   * true after the first success and stays true, so the effect never fires
   * again and the second ingredient in a row kept its text.
   */
  const addThenClear = async (previous: FormState, form: FormData) => {
    const result = await action(previous, form)
    if (result.done) {
      /* Raised before the clearing below: the confirmation is about a name
         this form is no longer holding. */
      toast({message: t('added')})
      setName('')
      setPhotoUrl('')
      nameRef.current?.focus()
      /* The list holds its own pages; revalidating the server's copy no
         longer reaches it, so the new ingredient would not appear. */
      await queryClient.invalidateQueries({queryKey: queryKeys.ingredients})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(addThenClear, {})

  /** Mounted means opened, so this is where the typing should start. */
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  return (
    <form
      action={formAction}
      aria-label={t('addTitle')}
      className="flex flex-col gap-3 rounded-lg border border-light bg-background-foreground p-4"
    >
      <IngredientFields
        name={name}
        photoUrl={photoUrl}
        onName={setName}
        onPhotoUrl={setPhotoUrl}
        nameRef={nameRef}
        errorId={state.error ? messageId : undefined}
      />

      {/* Stays open after each ingredient, so several can be added in a
          row; cancel is the way back out. */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('add')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
      </div>

      {/* Both of these name the field: a clash with an existing name, or a
          name and link that did not parse. They stay here, bound to the
          input, rather than going to a toast with nothing to point at. */}
      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'duplicateName' ? 'duplicate' : 'invalid')}
        </p>
      )}
    </form>
  )
}
