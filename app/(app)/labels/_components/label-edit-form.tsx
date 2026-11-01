'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {LabelWithUsage} from '@/lib/labels'
import {updateLabelAction} from '../actions'
import {DeleteLabelConfirm} from './delete-label-confirm'

type Props = {
  label: LabelWithUsage
  onDone: () => void
  onCancel: () => void
}

export function LabelEditForm({label, onDone, onCancel}: Props) {
  const t = useTranslations('labels')
  const [state, formAction, pending] = useActionState(updateLabelAction, {})
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)
  const [confirming, setConfirming] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const colorId = useId()
  const messageId = useId()

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])

  if (confirming) {
    return (
      <DeleteLabelConfirm
        label={label}
        onCancel={() => setConfirming(false)}
        onDeleted={onDone}
      />
    )
  }

  return (
    <form
      action={formAction}
      aria-label={t('editLabel', {name: label.name})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={label.id} />
      <input type="hidden" name="labelGroupId" value={label.labelGroupId} />

      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={nameId}>
          {t('name')}
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

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={colorId}>
          {t('color')}
        </label>
        <input
          id={colorId}
          name="color"
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="h-10 w-16 rounded-lg border border-secondary-foreground bg-background p-1"
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
        onClick={onCancel}
        className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
      >
        {t('cancel')}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-primary-strong px-3 py-2 font-semibold text-primary-strong text-sm"
      >
        {t('delete')}
      </button>

      {state.error && (
        <p
          role="alert"
          id={messageId}
          className="w-full text-primary-strong text-sm"
        >
          {t(
            state.error === 'duplicateName'
              ? 'duplicate'
              : state.error === 'gone'
                ? 'labelGone'
                : 'invalid',
          )}
        </p>
      )}
    </form>
  )
}
