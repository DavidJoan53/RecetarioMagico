'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {FormState} from '../actions'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
}

export function IngredientForm({action}: Props) {
  const t = useTranslations('ingredients')
  const [state, formAction, pending] = useActionState(action, {})
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const photoId = useId()
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
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={nameId}>
          {t('name')}
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          aria-describedby={state.error ? messageId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={photoId}>
          {t('photoUrl')}
        </label>
        <input
          id={photoId}
          name="photoUrl"
          type="url"
          value={photoUrl}
          onChange={e => setPhotoUrl(e.target.value)}
          placeholder={t('photoPlaceholder')}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

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
          {state.error === 'duplicateName' ? t('duplicate') : t('invalid')}
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
