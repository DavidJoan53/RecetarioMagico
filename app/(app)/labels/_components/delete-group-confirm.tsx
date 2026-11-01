'use client'

import {useTranslations} from 'next-intl'
import {useActionState, useEffect, useRef} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import type {GroupWithLabels} from '@/lib/labels'
import {deleteLabelGroupAction, type FormState} from '../actions'

type Props = {
  group: GroupWithLabels
  onCancel: () => void
}

export function DeleteGroupConfirm({group, onCancel}: Props) {
  const t = useTranslations('labels')
  const announce = useAnnounceDeletion()
  const cancel = useRef<HTMLButtonElement>(null)

  const attachments = group.labels.reduce((n, l) => n + l.recipeCount, 0)

  /** Announced from the action: the section is gone before state renders. */
  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await deleteLabelGroupAction(previous, form)
    if (result.done) announce(t('groupDeleted', {name: group.name}))
    return result
  }

  const [state, formAction, pending] = useActionState(removeThen, {})

  /** Land on the way out, not on the destructive button. */
  useEffect(() => {
    cancel.current?.focus()
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={group.id} />

      <p className="font-semibold text-sm">
        {t('confirmDeleteGroup', {name: group.name})}
      </p>
      {/* Two cascades: the group takes its labels, and each label comes off
          the recipes carrying it. Both numbers, because neither is obvious. */}
      <p className="text-secondary-foreground text-sm">
        {group.labels.length === 0
          ? t('groupHasNoLabels')
          : t('groupTakesLabels', {
              labels: group.labels.length,
              recipes: attachments,
            })}
      </p>

      {state.error && (
        <p role="alert" className="text-primary-strong text-sm">
          {t('groupGone')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white disabled:opacity-60"
        >
          {t('confirmDeleteAction')}
        </button>
      </div>
    </form>
  )
}
