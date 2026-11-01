'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {createLabelGroupAction, type FormState} from '../actions'

export function NewGroupForm() {
  const t = useTranslations('labels')
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createLabelGroupAction,
    {},
  )
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const messageId = useId()

  useEffect(() => {
    if (!state.done) return
    setName('')
    nameRef.current?.focus()
  }, [state.done])

  return (
    <form
      action={formAction}
      aria-label={t('newGroup')}
      className="flex flex-col gap-2 rounded-lg border border-light bg-background-foreground p-4"
    >
      <label className="font-semibold text-sm" htmlFor={nameId}>
        {t('newGroup')}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('groupPlaceholder')}
          aria-describedby={state.error ? messageId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="min-w-40 flex-1 rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('createGroup')}
        </button>
      </div>

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'duplicateName' ? 'groupDuplicate' : 'invalid')}
        </p>
      )}
      {state.done && (
        <p role="status" className="text-secondary-foreground text-sm">
          {t('groupAdded')}
        </p>
      )}
    </form>
  )
}
