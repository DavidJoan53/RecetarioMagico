'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useRef} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import {type DeleteState, deleteIngredientAction} from '../actions'

type Props = {
  ingredient: IngredientWithPantry
  onCancel: () => void
}

export function DeleteConfirm({ingredient, onCancel}: Props) {
  const t = useTranslations('ingredients')
  const announce = useAnnounceDeletion()
  const cancel = useRef<HTMLButtonElement>(null)

  /**
   * Announced here rather than from the resulting state: this row is gone
   * once the list revalidates, so it may never render that state at all.
   */
  const deleteThen = async (previous: DeleteState, form: FormData) => {
    const result = await deleteIngredientAction(previous, form)
    if (!result.error) announce(t('deleted', {name: ingredient.name}))
    return result
  }

  const [state, formAction, pending] = useActionState(deleteThen, {})

  /** Land on the way out, not on the destructive button. */
  useEffect(() => {
    cancel.current?.focus()
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={ingredient.id} />

      <p className="font-semibold text-sm">
        {t('confirmDelete', {name: ingredient.name})}
      </p>
      {/* Nothing else mentions it: the pantry row is ON DELETE CASCADE. */}
      <p className="text-secondary-foreground text-sm">
        {t('alsoLeavesPantry')}
      </p>

      {state.error && (
        <p role="alert" className="text-primary-strong text-sm">
          {state.error === 'inUse'
            ? t('inUse', {count: state.recipeCount ?? 0})
            : t('gone')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('confirmDeleteAction')}
        </button>
      </div>
    </form>
  )
}
