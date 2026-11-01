'use client'

import {useTranslations} from 'next-intl'
import {useActionState} from 'react'
import {togglePantryAction} from '../actions'

type Props = {
  ingredientId: string
  name: string
  inPantry: boolean
}

/**
 * A button rather than a checkbox: this saves on press, and a checkbox that
 * writes without a submit lies about what it is. aria-pressed carries the
 * state a tick would have.
 */
export function PantryToggle({ingredientId, name, inPantry}: Props) {
  const t = useTranslations('pantry')
  const [, formAction, pending] = useActionState(togglePantryAction, {})

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={ingredientId} />
      <input type="hidden" name="inPantry" value={String(inPantry)} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={inPantry}
        aria-label={t(inPantry ? 'removeLabel' : 'addLabel', {name})}
        className={
          inPantry
            ? 'rounded-lg border border-primary-strong bg-primary-strong px-3 py-1 font-semibold text-sm text-white disabled:opacity-60'
            : 'rounded-lg border border-secondary-foreground px-3 py-1 font-semibold text-sm disabled:opacity-60'
        }
      >
        {t(inPantry ? 'have' : 'haveNot')}
      </button>
    </form>
  )
}
