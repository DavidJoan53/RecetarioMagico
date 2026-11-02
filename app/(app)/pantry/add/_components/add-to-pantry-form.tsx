'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useRouter} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {useActionState, useId, useState} from 'react'
import {IngredientCombobox} from '@/components/ingredient-combobox'
import {useToast} from '@/components/toast-provider'
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
  const queryClient = useQueryClient()
  const toast = useToast()
  const router = useRouter()

  const addThenLeave = async (previous: AddState, form: FormData) => {
    const result = await addToPantryAction(previous, form)
    if (result.added) {
      /* The name comes from the result rather than from state: what was
         picked is on its way off screen. */
      toast({message: t('added', {name: result.added})})
      /* Two caches. The picker marks what is already in the pantry out of
         the ingredients one, and the pantry list holds its own pages -- the
         list this is about to land on. */
      await queryClient.invalidateQueries({queryKey: queryKeys.ingredients})
      await queryClient.invalidateQueries({queryKey: queryKeys.pantry})
      router.push('/pantry')
    }
    return result
  }

  const [state, formAction, pending] = useActionState(addThenLeave, {})

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
            /* Only the one about the amount. "alreadyThere" is about the
               ingredient that was picked, and pointing the quantity field at
               it says the number is wrong when it is not. */
            aria-describedby={state.error === 'invalid' ? messageId : undefined}
            aria-invalid={state.error === 'invalid' ? true : undefined}
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
        className="w-full rounded-lg bg-primary-strong px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {t('addOne')}
      </button>

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'alreadyThere' ? 'alreadyThere' : 'invalid')}
        </p>
      )}
    </form>
  )
}
