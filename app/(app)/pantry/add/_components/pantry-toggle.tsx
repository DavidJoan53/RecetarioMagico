'use client'

import {useTranslations} from 'next-intl'
import {useActionState} from 'react'
import {togglePantryAction} from '../../actions'

type Props = {
  ingredientId: string
  name: string
  inPantry: boolean
}

/**
 * A button rather than a checkbox: this saves on press, and a checkbox that
 * writes without a submit lies about what it is. aria-pressed carries the
 * state a tick would have.
 *
 * The tick is drawn as well as coloured. Two fills of the same shape are
 * indistinguishable at a glance and invisible to anyone who cannot separate
 * the two colours — WCAG 1.4.1 is the rule, but it was simply hard to read.
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
        className={`flex items-center gap-2 rounded-lg border px-3 py-1 font-semibold text-sm disabled:opacity-60 ${
          inPantry
            ? 'border-primary-strong bg-primary-strong text-white'
            : 'border-secondary-foreground border-dashed text-secondary-foreground'
        }`}
      >
        <span
          aria-hidden
          className={`flex size-5 items-center justify-center rounded border text-xs ${
            inPantry
              ? 'border-white bg-white text-primary-strong'
              : 'border-current'
          }`}
        >
          {inPantry ? '✓' : ''}
        </span>
        {t(inPantry ? 'have' : 'haveNot')}
      </button>
    </form>
  )
}
