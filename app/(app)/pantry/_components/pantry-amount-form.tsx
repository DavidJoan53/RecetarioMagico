'use client'

import {useQueryClient} from '@tanstack/react-query'
import {Check} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {useToast} from '@/components/toast-provider'
import type {PantryItem} from '@/db/pantry/queries'
import {unitEnum} from '@/db/schema'
import {queryKeys} from '@/lib/query-keys'
import {type FormState, updatePantryEntryAction} from '../actions'

type Props = {
  item: PantryItem
  onDone: () => void
  onCancel: () => void
}

export function PantryAmountForm({item, onDone, onCancel}: Props) {
  const t = useTranslations('pantry')
  const queryClient = useQueryClient()
  const toast = useToast()

  /* The list holds its own pages now, so the saved amount has to be asked
     for again — revalidating the server's copy no longer reaches it. */
  const saveThen = async (previous: FormState, form: FormData) => {
    const result = await updatePantryEntryAction(previous, form)
    if (result.done) {
      await queryClient.invalidateQueries({queryKey: queryKeys.pantry})
    }
    /* Taken out of the pantry elsewhere while this was open: the amount
       typed here is fine, there is just nothing to save it against. */
    if (result.error === 'gone') {
      toast({message: t('gone'), tone: 'error'})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(saveThen, {})
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
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={item.ingredientId} />

      <div className="flex flex-wrap items-end gap-2">
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
            aria-describedby={state.error === 'invalid' ? messageId : undefined}
            aria-invalid={state.error === 'invalid' ? true : undefined}
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

        {/* Beside the amount it saves. Named per row: a pantry of ticks
            all reading "Guardar" says nothing about which one is which. */}
        <button
          type="submit"
          disabled={pending}
          aria-label={t('saveLabel', {name: item.name})}
          className="flex size-11 items-center justify-center rounded-lg bg-primary-strong text-white disabled:opacity-60"
        >
          <Check aria-hidden="true" size={18} />
        </button>
      </div>

      {/* About the amount: a missing number or no unit chosen. */}
      {state.error === 'invalid' && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t('invalid')}
        </p>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
      >
        {t('cancel')}
      </button>
    </form>
  )
}
