'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {timeZone} from '@/i18n/time-zone'
import {type DinnerListItem, toDateTimeLocal} from '@/lib/dinners'
import {queryKeys} from '@/lib/query-keys'
import {type FormState, updateDinnerAction} from '../actions'
import {DinnerFields} from './dinner-fields'

type Props = {
  dinner: DinnerListItem
  /** Already formatted: the row knows how it names itself. */
  date: string
  onDone: () => void
  onCancel: () => void
}

/** The same fields as the form that creates one, filled in. */
export function DinnerEditForm({dinner, date, onDone, onCancel}: Props) {
  const t = useTranslations('dinners')
  const queryClient = useQueryClient()

  /* The list reads its own cache, so a changed dinner has to be asked for
     again rather than revalidated on the server. */
  const saveThen = async (previous: FormState, form: FormData) => {
    const result = await updateDinnerAction(previous, form)
    if (result.done) {
      await queryClient.invalidateQueries({queryKey: queryKeys.dinners})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(saveThen, {})
  const [eatenAt, setEatenAt] = useState(() =>
    toDateTimeLocal(new Date(dinner.eatenAt), timeZone),
  )
  const [notes, setNotes] = useState(dinner.notes ?? '')
  const [chosen, setChosen] = useState(dinner.recipes)
  const whenRef = useRef<HTMLInputElement>(null)
  const messageId = useId()

  /** The row became a form; say where you are rather than moving silently. */
  useEffect(() => {
    whenRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])

  return (
    <form
      action={formAction}
      aria-label={t('editTitle', {date})}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={dinner.id} />

      <DinnerFields
        eatenAt={eatenAt}
        onEatenAt={setEatenAt}
        notes={notes}
        onNotes={setNotes}
        chosen={chosen}
        onAdd={recipe => setChosen(current => [...current, recipe])}
        onRemove={id => setChosen(current => current.filter(r => r.id !== id))}
        whenRef={whenRef}
        errorId={state.error ? messageId : undefined}
      />

      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(
            state.error === 'recipeGone'
              ? 'recipeGone'
              : state.error === 'gone'
                ? 'gone'
                : 'invalid',
          )}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-secondary-foreground px-4 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
