'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {FormState} from '../actions'
import {IngredientFields} from './ingredient-fields'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
}

export function IngredientForm({action}: Props) {
  const t = useTranslations('ingredients')
  const [state, formAction, pending] = useActionState(action, {})
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const messageId = useId()

  /**
   * Controlled on purpose. React resets an uncontrolled form after an action
   * whether it succeeded or not, so a rejected name would take what was typed
   * with it. Clearing is a thing that happens on success only.
   */
  useEffect(() => {
    if (!state.done) return
    setName('')
    setPhotoUrl('')
    nameRef.current?.focus()
  }, [state.done])

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

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
      >
        + {t('add')}
      </button>

      {/* Focus moves back to the input on success, so the outcome has to be
          announced rather than seen. alert interrupts; status waits. */}
      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'duplicateName' ? 'duplicate' : 'invalid')}
        </p>
      )}
      {state.done && (
        <p role="status" className="text-secondary-foreground text-sm">
          {t('added')}
        </p>
      )}
    </form>
  )
}
