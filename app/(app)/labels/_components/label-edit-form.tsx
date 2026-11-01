'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import type {LabelWithUsage} from '@/lib/labels'
import {deleteLabelAction, type FormState, updateLabelAction} from '../actions'

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
      <DeleteLabel
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

function DeleteLabel({
  label,
  onCancel,
  onDeleted,
}: {
  label: LabelWithUsage
  onCancel: () => void
  onDeleted: () => void
}) {
  const t = useTranslations('labels')
  const announce = useAnnounceDeletion()
  const cancel = useRef<HTMLButtonElement>(null)

  /** Announced from the action: the chip is gone before any state renders. */
  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await deleteLabelAction(previous, form)
    if (result.done) {
      announce(t('deleted', {name: label.name}))
      onDeleted()
    }
    return result
  }

  const [state, formAction, pending] = useActionState(removeThen, {})

  /** Land on the way out, not on the destructive button. */
  useEffect(() => {
    cancel.current?.focus()
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={label.id} />

      <p className="font-semibold text-sm">
        {t('confirmDelete', {name: label.name})}
      </p>
      {/* recipe_labels is ON DELETE CASCADE: nothing refuses, so the number
          has to be here rather than in an apology afterwards. */}
      <p className="text-secondary-foreground text-sm">
        {label.recipeCount > 0
          ? t('alsoLeavesRecipes', {count: label.recipeCount})
          : t('usedByNothing')}
      </p>

      {state.error && (
        <p role="alert" className="text-primary-strong text-sm">
          {t('labelGone')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('confirmDeleteAction')}
        </button>
      </div>
    </form>
  )
}
