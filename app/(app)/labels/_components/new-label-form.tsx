'use client'

import {Plus, X} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useToast} from '@/components/toast-provider'
import {createLabelAction, type FormState} from '../actions'

/** Any hex is allowed, so this only has to be a reasonable starting point. */
const DEFAULT_COLOR = '#118ab2'

type Props = {
  groupId: string
  groupName: string
  /** Closes the form. It is opened from a plus — see add-label. */
  onCancel: () => void
}

export function NewLabelForm({groupId, groupName, onCancel}: Props) {
  const t = useTranslations('labels')
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const colorId = useId()
  const messageId = useId()
  const toast = useToast()

  /**
   * Controlled: React clears an uncontrolled form after an action even when it
   * failed, which takes the rejected name with it. Cleared here rather than
   * from an effect on state.done — that stays true, so only the first label in
   * a row was cleared. The colour is kept: the next one usually shares it.
   */
  const addThenClear = async (previous: FormState, form: FormData) => {
    const result = await createLabelAction(previous, form)
    if (result.done) {
      toast({message: t('added')})
      setName('')
      nameRef.current?.focus()
    }
    /* The group this form belongs to has gone: there is no field to point
       at and nothing left here that would fix it. */
    if (result.error === 'noGroup') {
      toast({message: t('groupGone'), tone: 'error'})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(addThenClear, {})

  /** Mounted means opened, so this is where the typing should start. */
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  /* Both of these are about the name: taken already, or not a name at all. */
  const fieldError =
    state.error === 'duplicateName'
      ? 'duplicate'
      : state.error === 'invalid'
        ? 'invalid'
        : null

  return (
    <form
      action={formAction}
      aria-label={t('addTo', {group: groupName})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="labelGroupId" value={groupId} />

      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={nameId}>
          {t('newLabel')}
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          aria-describedby={fieldError ? messageId : undefined}
          aria-invalid={fieldError ? true : undefined}
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

      {/* Icon only, so the label carries the word it replaced — named after
          the group, since every group on the page has one of these. */}
      <button
        type="submit"
        disabled={pending}
        aria-label={t('addTo', {group: groupName})}
        className="flex size-8 items-center justify-center rounded-lg bg-primary-strong text-white disabled:opacity-60"
      >
        <Plus aria-hidden="true" size={16} />
      </button>

      {/* Stays open after each label, so several can be added in a row; this
          is the only way back out. */}
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('cancel')}
        className="flex size-8 items-center justify-center rounded-lg border border-secondary-foreground"
      >
        <X aria-hidden="true" size={16} />
      </button>

      {fieldError && (
        <p
          role="alert"
          id={messageId}
          className="w-full text-primary-strong text-sm"
        >
          {t(fieldError)}
        </p>
      )}
    </form>
  )
}
