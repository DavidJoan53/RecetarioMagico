'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useId, useRef, useState} from 'react'
import {IngredientCombobox} from '@/components/ingredient-combobox'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import {unitEnum} from '@/db/schema'
import {queryKeys} from '@/lib/query-keys'
import {type AddState, addToPantryAction} from '../../actions'

export function AddToPantryForm() {
  const t = useTranslations('pantry')
  const [chosen, setChosen] = useState<IngredientWithPantry | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const quantityId = useId()
  const unitId = useId()
  const messageId = useId()
  const added = useRef<string[]>([])
  const queryClient = useQueryClient()

  /**
   * Cleared here rather than from an effect on the result: the state after a
   * second successful add is the same object shape as the first, so an effect
   * watching it would not fire again.
   */
  const addThenClear = async (previous: AddState, form: FormData) => {
    const result = await addToPantryAction(previous, form)
    if (result.added) {
      added.current = [result.added, ...added.current]
      setChosen(null)
      setQuantity('')
      setUnit('')
      /* The picker marks what is already in the pantry out of this cache,
         so without it the one just added goes on being offered as though it
         were not there. Stale rather than refetched: the list is closed by
         now, and it asks again when it is next opened. */
      await queryClient.invalidateQueries({queryKey: queryKeys.ingredients})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(addThenClear, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {chosen && (
        <>
          <input type="hidden" name="ingredientId" value={chosen.id} />
          <input type="hidden" name="ingredientName" value={chosen.name} />
        </>
      )}

      <IngredientCombobox value={chosen} onChange={setChosen} />

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm" htmlFor={quantityId}>
            {t('quantity')}
          </label>
          <input
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
            className="w-28 rounded-lg border border-secondary-foreground bg-background px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm" htmlFor={unitId}>
            {t('unit')}
          </label>
          <select
            id={unitId}
            name="unit"
            required
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
          >
            {/* Empty and disabled: a placeholder, not a choosable answer —
                an amount needs both halves to mean anything. */}
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
      </div>

      {/* Disabled until something is chosen: the form cannot do anything
          without one, and saying so is better than refusing afterwards. */}
      <button
        type="submit"
        disabled={pending || !chosen}
        className="self-start rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
      >
        {t('addOne')}
      </button>

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'alreadyThere' ? 'alreadyThere' : 'invalid')}
        </p>
      )}

      {/* The combobox clears on success, so the confirmation is the only
          trace of what just happened. */}
      {added.current.length > 0 && !state.error && (
        <p role="status" className="text-secondary-foreground text-sm">
          {t('addedCount', {
            name: added.current[0] ?? '',
            count: added.current.length,
          })}
        </p>
      )}
    </form>
  )
}
