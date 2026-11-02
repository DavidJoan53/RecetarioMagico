'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useRef} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import {queryKeys} from '@/lib/query-keys'
import {type DeleteState, deleteDinnerAction} from '../actions'

type Props = {
  id: string
  /** Already formatted: the row knows how it names itself. */
  date: string
  onCancel: () => void
}

export function DeleteConfirm({id, date, onCancel}: Props) {
  const t = useTranslations('dinners')
  const announce = useAnnounceDeletion()
  const cancel = useRef<HTMLButtonElement>(null)
  const queryClient = useQueryClient()

  /**
   * Announced here rather than from the resulting state: this row is gone
   * once the list refreshes, so it may never render that state at all.
   */
  const deleteThen = async (previous: DeleteState, form: FormData) => {
    const result = await deleteDinnerAction(previous, form)
    if (!result.error) {
      announce(t('deleted', {date}))
      /* The list holds its own pages, so the deleted row would stay on
         screen on nothing but the server having been revalidated. */
      await queryClient.invalidateQueries({queryKey: queryKeys.dinners})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(deleteThen, {})

  /** Land on the way out, not on the destructive button. */
  useEffect(() => {
    cancel.current?.focus()
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />

      <p className="font-semibold text-sm">{t('confirmDelete', {date})}</p>
      {/* Worth saying: the row lists recipes, so deleting it looks like it
          might take them. dinner_recipes is the only thing that goes. */}
      <p className="text-secondary-foreground text-sm">{t('keepsRecipes')}</p>

      {state.error && (
        <p role="alert" className="text-primary-strong text-sm">
          {t('gone')}
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
