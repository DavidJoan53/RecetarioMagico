'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useId, useRef, useState} from 'react'
import {createLabelAction, type FormState} from '../actions'

/** Any hex is allowed, so this only has to be a reasonable starting point. */
const DEFAULT_COLOR = '#118ab2'

type Props = {
  groupId: string
  groupName: string
}

export function NewLabelForm({groupId, groupName}: Props) {
  const t = useTranslations('labels')
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const colorId = useId()
  const messageId = useId()

  /**
   * Controlled: React clears an uncontrolled form after an action even when it
   * failed, which takes the rejected name with it. Cleared here rather than
   * from an effect on state.done — that stays true, so only the first label in
   * a row was cleared. The colour is kept: the next one usually shares it.
   */
  const addThenClear = async (previous: FormState, form: FormData) => {
    const result = await createLabelAction(previous, form)
    if (result.done) {
      setName('')
      nameRef.current?.focus()
    }
    return result
  }

  const [state, formAction, pending] = useActionState(addThenClear, {})

  return (
    <form
      action={formAction}
      aria-label={t('addTo', {group: groupName})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="labelGroupId" value={groupId} />

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
        + {t('add')}
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
              : state.error === 'noGroup'
                ? 'groupGone'
                : 'invalid',
          )}
        </p>
      )}
      {state.done && (
        <p role="status" className="w-full text-secondary-foreground text-sm">
          {t('added')}
        </p>
      )}
    </form>
  )
}
