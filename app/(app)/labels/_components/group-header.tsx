'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {GroupWithLabels} from '@/lib/labels'
import {DeleteGroupConfirm} from './delete-group-confirm'
import {RenameGroupForm} from './rename-group-form'

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
    return <RenameGroupForm group={group} onClose={close(editButton)} />
  }
  if (mode === 'confirm-delete') {
    return <DeleteGroupConfirm group={group} onCancel={close(deleteButton)} />
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
