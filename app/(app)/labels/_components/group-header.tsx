'use client'

import {useTranslations} from 'next-intl'
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import {useAnnounceDeletion} from '@/components/deletion-announcer'
import type {GroupWithLabels} from '@/lib/labels'
import {
  deleteLabelGroupAction,
  type FormState,
  updateLabelGroupAction,
} from '../actions'

type Mode = 'view' | 'edit' | 'confirm-delete'

export function GroupHeader({
  group,
  headingId,
}: {
  group: GroupWithLabels
  headingId: string
}) {
  const t = useTranslations('labels')
  const [mode, setMode] = useState<Mode>('view')
  const editButton = useRef<HTMLButtonElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const restoreTo = useRef<React.RefObject<HTMLButtonElement | null>>(null)

  useEffect(() => {
    if (mode !== 'view' || !restoreTo.current) return
    const target = restoreTo.current
    restoreTo.current = null
    target.current?.focus()
  }, [mode])

  const close = useCallback(
    (to: React.RefObject<HTMLButtonElement | null>) => () => {
      restoreTo.current = to
      setMode('view')
    },
    [],
  )

  if (mode === 'edit') {
    return <RenameGroup group={group} onClose={close(editButton)} />
  }
  if (mode === 'confirm-delete') {
    return <DeleteGroup group={group} onCancel={close(deleteButton)} />
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2
        id={headingId}
        className="flex-1 font-mono text-secondary-foreground text-xs uppercase tracking-wider"
      >
        {group.name}
      </h2>
      <button
        ref={editButton}
        type="button"
        onClick={() => setMode('edit')}
        aria-label={t('editGroupLabel', {name: group.name})}
        className="rounded-lg border border-secondary-foreground px-2 py-1 font-semibold text-xs"
      >
        {t('edit')}
      </button>
      <button
        ref={deleteButton}
        type="button"
        onClick={() => setMode('confirm-delete')}
        aria-label={t('deleteGroupLabel', {name: group.name})}
        className="rounded-lg border border-primary-strong px-2 py-1 font-semibold text-primary-strong text-xs"
      >
        {t('delete')}
      </button>
    </div>
  )
}

function RenameGroup({
  group,
  onClose,
}: {
  group: GroupWithLabels
  onClose: () => void
}) {
  const t = useTranslations('labels')
  const [state, formAction, pending] = useActionState(
    updateLabelGroupAction,
    {},
  )
  const [name, setName] = useState(group.name)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const messageId = useId()

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state.done) onClose()
  }, [state.done, onClose])

  return (
    <form
      action={formAction}
      aria-label={t('editGroupLabel', {name: group.name})}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={group.id} />
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label className="font-semibold text-xs" htmlFor={nameId}>
          {t('groupName')}
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          aria-describedby={state.error ? messageId : undefined}
          aria-invalid={state.error ? true : undefined}
          className="rounded-lg border border-secondary-foreground bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white disabled:opacity-60"
      >
        {t('save')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm"
      >
        {t('cancel')}
      </button>
      {state.error && (
        <p
          role="alert"
          id={messageId}
          className="w-full text-primary-strong text-sm"
        >
          {t(state.error === 'duplicateName' ? 'groupDuplicate' : 'groupGone')}
        </p>
      )}
    </form>
  )
}

function DeleteGroup({
  group,
  onCancel,
}: {
  group: GroupWithLabels
  onCancel: () => void
}) {
  const t = useTranslations('labels')
  const announce = useAnnounceDeletion()
  const cancel = useRef<HTMLButtonElement>(null)

  const attachments = group.labels.reduce((n, l) => n + l.recipeCount, 0)

  const removeThen = async (previous: FormState, form: FormData) => {
    const result = await deleteLabelGroupAction(previous, form)
    if (result.done) announce(t('groupDeleted', {name: group.name}))
    return result
  }

  const [state, formAction, pending] = useActionState(removeThen, {})

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
