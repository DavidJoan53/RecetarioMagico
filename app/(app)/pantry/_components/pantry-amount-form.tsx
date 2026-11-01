'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import type {PantryItem} from '@/db/pantry/queries'
import {unitEnum} from '@/db/schema'
import {updatePantryEntryAction} from '../actions'

type Props = {
  item: PantryItem
  onDone: () => void
  onCancel: () => void
}

export function PantryAmountForm({item, onDone, onCancel}: Props) {
  const t = useTranslations('pantry')
  const [state, formAction, pending] = useActionState(
    updatePantryEntryAction,
    {},
  )
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? '')
  const [unit, setUnit] = useState(item.unit ?? '')
  const quantityRef = useRef<HTMLInputElement>(null)
  const quantityId = useId()
  const unitId = useId()
  const messageId = useId()

  useEffect(() => {
    quantityRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])

  return (
    <form
      action={formAction}
      aria-label={t('amountFor', {name: item.name})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={item.ingredientId} />

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={quantityId}>
          {t('quantity')}
        </label>
        <input
          ref={quantityRef}
          id={quantityId}
          name="quantity"
          type="number"
          inputMode="decimal"
          required
          min="0"
          step="any"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          aria-describedby={state.error ? messageId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="w-28 rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={unitId}>
          {t('unit')}
        </label>
        <select
          id={unitId}
          name="unit"
          required
          value={unit}
          onChange={e => setUnit(e.target.value)}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
        >
          {/* Disabled placeholder: an amount needs both halves. Rows written
              before this rule still open here with it selected. */}
          <option value="" disabled>
            {t('chooseUnit')}
          </option>
          {unitEnum.enumValues.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
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

      {state.error && (
        <p
          role="alert"
          id={messageId}
          className="w-full text-primary-strong text-sm"
        >
          {t(state.error === 'gone' ? 'gone' : 'invalid')}
        </p>
      )}
    </form>
  )
}
