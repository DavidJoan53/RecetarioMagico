'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useRef} from 'react'
import {useCatchFocus} from '@/components/focus-catcher'
import {useToast} from '@/components/toast-provider'
import type {LabelWithUsage} from '@/lib/labels'
import {deleteLabelAction, type FormState} from '../actions'

type Props = {
  label: LabelWithUsage
  onCancel: () => void
  onDeleted: () => void
}

export function DeleteLabelConfirm({label, onCancel, onDeleted}: Props) {
  const t = useTranslations('labels')
  const toast = useToast()
  const catchFocus = useCatchFocus()
  const cancel = useRef<HTMLButtonElement>(null)

  /** Announced from the action: the chip is gone before any state renders. */
  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await deleteLabelAction(previous, form)
    if (result.done) {
      toast({message: t('deleted', {name: label.name})})
      catchFocus()
      onDeleted()
    }
    return result
  }

  const [state, formAction, pending] = useActionState(removeThen, {})

  /** Land on the way out, not on the destructive button. */
  useEffect(() => {
    cancel.current?.focus()
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={label.id} />

      <p className="font-semibold text-sm">
        {t('confirmDelete', {name: label.name})}
      </p>
      {/* recipe_labels is ON DELETE CASCADE: nothing refuses, so the number
          has to be here rather than in an apology afterwards. */}
      <p className="text-secondary-foreground text-sm">
        {label.recipeCount > 0
          ? t('alsoLeavesRecipes', {count: label.recipeCount})
          : t('usedByNothing')}
      </p>

      {state.error && (
        <p role="alert" className="text-primary-strong text-sm">
          {t('labelGone')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('confirmDeleteAction')}
        </button>
      </div>
    </form>
  )
}
