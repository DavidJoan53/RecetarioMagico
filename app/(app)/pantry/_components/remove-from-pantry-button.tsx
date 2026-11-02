'use client'

import {useQueryClient} from '@tanstack/react-query'
import {Trash2} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useActionState} from 'react'
import {useCatchFocus} from '@/components/focus-catcher'
import {useToast} from '@/components/toast-provider'
import type {PantryItem} from '@/db/pantry/queries'
import {queryKeys} from '@/lib/query-keys'
import {type FormState, removeFromPantryAction} from '../actions'

/**
 * No confirmation. Nothing is destroyed — the ingredient stays, only the
 * having goes, and putting it back is one press on /ingredients.
 */
export function RemoveFromPantryButton({item}: {item: PantryItem}) {
  const t = useTranslations('pantry')
  const toast = useToast()
  const catchFocus = useCatchFocus()
  const queryClient = useQueryClient()

  /**
   * The action revalidates the server's copy, which the list no longer reads
   * from once it is holding its own pages — without this the row stays on
   * screen after it has gone from the database.
   */
  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await removeFromPantryAction(previous, form)
    if (result.done) {
      toast({message: t('removed', {name: item.name})})
      catchFocus()
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
        className="flex size-8 items-center justify-center rounded-lg border border-primary-strong text-primary-strong disabled:opacity-60"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </form>
  )
}
