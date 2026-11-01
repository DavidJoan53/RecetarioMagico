'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useActionState} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import type {PantryItem} from '@/db/pantry/queries'
import {queryKeys} from '@/lib/query-keys'
import {type FormState, removeFromPantryAction} from '../actions'

/**
 * No confirmation. Nothing is destroyed — the ingredient stays, only the
 * having goes, and putting it back is one press on /ingredients.
 */
export function RemoveFromPantryButton({item}: {item: PantryItem}) {
  const t = useTranslations('pantry')
  const announce = useAnnounceDeletion()
  const queryClient = useQueryClient()

  /**
   * The action revalidates the server's copy, which the list no longer reads
   * from once it is holding its own pages — without this the row stays on
   * screen after it has gone from the database.
   */
  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await removeFromPantryAction(previous, form)
    if (result.done) {
      announce(t('removed', {name: item.name}))
      await queryClient.invalidateQueries({queryKey: queryKeys.pantry})
    }
    return result
  }

  const [, formAction, pending] = useActionState(removeThen, {})

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={item.ingredientId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={t('removeLabel', {name: item.name})}
        className="rounded-lg border border-primary-strong px-3 py-1 font-semibold text-primary-strong text-sm disabled:opacity-60"
      >
        {t('remove')}
      </button>
    </form>
  )
}
