'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useId, useRef, useState} from 'react'
import {timeZone} from '@/i18n/time-zone'
import {type DinnerRecipe, toDateTimeLocal} from '@/lib/dinners'
import {queryKeys} from '@/lib/query-keys'
import {DinnerFields} from '../../_components/dinner-fields'
import type {FormState} from '../../actions'

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>
}

export function DinnerForm({action}: Props) {
  const t = useTranslations('dinners')
  const [eatenAt, setEatenAt] = useState('')
  const [notes, setNotes] = useState('')
  const [chosen, setChosen] = useState<DinnerRecipe[]>([])
  const whenRef = useRef<HTMLInputElement>(null)
  const messageId = useId()
  const queryClient = useQueryClient()

  /**
   * Now, filled after the first paint rather than during it. The server and
   * the browser do not reach this line at the same instant, and a time
   * rendered on both has to come out the same or React hydrates over a value
   * that is already on screen.
   */
  useEffect(() => {
    setEatenAt(current => current || toDateTimeLocal(new Date(), timeZone))
  }, [timeZone])

  /**
   * Controlled on purpose. React resets an uncontrolled form after an action
   * whether it succeeded or not, so a rejected dinner would lose everything
   * that was picked. Clearing is a thing that happens on success only.
   */
  const logThenClear = async (previous: FormState, form: FormData) => {
    const result = await action(previous, form)
    if (result.done) {
      setNotes('')
      setChosen([])
      setEatenAt(toDateTimeLocal(new Date(), timeZone))
      whenRef.current?.focus()
      /* The list holds its own pages; revalidating the server's copy no
         longer reaches it, so the new dinner would not appear. */
      await queryClient.invalidateQueries({queryKey: queryKeys.dinners})
    }
    return result
  }

  const [state, formAction, pending] = useActionState(logThenClear, {})

  return (
    <form
      action={formAction}
      aria-label={t('addTitle')}
      className="flex flex-col gap-3 rounded-lg border border-light bg-background-foreground p-4"
    >
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

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary-strong px-4 py-2 font-semibold text-sm text-white disabled:opacity-60"
      >
        + {t('add')}
      </button>

      {/* Focus moves back to the first field on success, so the outcome has
          to be announced rather than seen. alert interrupts; status waits. */}
      {state.error && (
        <p role="alert" id={messageId} className="text-primary-strong text-sm">
          {t(state.error === 'recipeGone' ? 'recipeGone' : 'invalid')}
        </p>
      )}
      {state.done && (
        <p role="status" className="text-secondary-foreground text-sm">
          {t('added')}
        </p>
      )}
    </form>
  )
}
