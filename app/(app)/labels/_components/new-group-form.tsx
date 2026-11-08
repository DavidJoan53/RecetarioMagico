'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useToast} from '@/components/toast-provider'
import {createLabelGroupAction, type FormState} from '../actions'

type Props = {
  /** Closes the form. It is opened from a plus — see add-group. */
  onCancel: () => void
}

export function NewGroupForm({onCancel}: Props) {
  const t = useTranslations('labels')
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const messageId = useId()
  const toast = useToast()

  /**
   * Cleared here, not from an effect on state.done: that is true after the
   * first success and stays true, so the second group in a row kept its name.
   */
  const createThenClear = async (previous: FormState, form: FormData) => {
    const result = await createLabelGroupAction(previous, form)
    if (result.done) {
      toast({message: t('groupAdded')})
      setName('')
      nameRef.current?.focus()
    }
    return result
  }

  const [state, formAction, pending] = useActionState(createThenClear, {})

  /** Mounted means opened, so this is where the typing should start. */
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  return (
    <form
      action={formAction}
      aria-label={t('newGroup')}
      className="flex flex-col gap-3 rounded-lg border border-light bg-background-foreground p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm" htmlFor={nameId}>
          {t('newGroup')}
        </label>
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
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
        />
      </div>

      {/* Stays open after each group, so several can be added in a row;
          cancel is the way back out. */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('createGroup')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
      </div>

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'duplicateName' ? 'groupDuplicate' : 'invalid')}
        </p>
      )}
    </form>
  )
}
