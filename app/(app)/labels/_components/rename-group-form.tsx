'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {LabelGroup} from '@/db/schema'
import {updateLabelGroupAction} from '../actions'

type Props = {
  group: LabelGroup
  onClose: () => void
}

export function RenameGroupForm({group, onClose}: Props) {
  const t = useTranslations('labels')
  const [state, formAction, pending] = useActionState(
    updateLabelGroupAction,
    {},
  )
  const [name, setName] = useState(group.name)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const messageId = useId()

  /** The heading became a form; say where you are rather than moving silently. */
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onClose()
  }, [state.done, onClose])

  return (
    <form
      action={formAction}
      aria-label={t('editGroupLabel', {name: group.name})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={group.id} />

      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={nameId}>
          {t('groupName')}
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          aria-describedby={state.error ? messageId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white disabled:opacity-60"
      >
        {t('save')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
      >
        {t('cancel')}
      </button>

      {state.error && (
        <p
          role="alert"
          id={messageId}
          className="w-full text-primary-strong text-sm"
        >
          {t(state.error === 'duplicateName' ? 'groupDuplicate' : 'groupGone')}
        </p>
      )}
    </form>
  )
}
