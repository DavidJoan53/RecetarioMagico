'use client'

import {Pencil, Plus, Trash2} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {GroupWithLabels} from '@/lib/labels'
import {DeleteGroupConfirm} from './delete-group-confirm'
import {NewLabelForm} from './new-label-form'
import {RenameGroupForm} from './rename-group-form'

type Mode = 'view' | 'add-label' | 'edit' | 'confirm-delete'

const ACTION =
  'flex size-8 items-center justify-center rounded-lg border border-secondary-foreground'

export function GroupHeader({
  group,
  headingId,
}: {
  group: GroupWithLabels
  headingId: string
}) {
  const t = useTranslations('labels')
  const [mode, setMode] = useState<Mode>('view')
  const addButton = useRef<HTMLButtonElement>(null)
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Rendered in every mode. The section around this is named by it, so
            a mode that took it away would leave that reference pointing at
            nothing — and you would lose sight of which group you are in. */}
        <h2
          id={headingId}
          className="flex-1 font-semibold text-secondary-foreground text-xs uppercase tracking-wider"
        >
          {group.name}
        </h2>

        {/* All three named after the group: a page of them is otherwise three
            identical glyphs per section. */}
        {mode === 'view' && (
          <>
            <button
              ref={addButton}
              type="button"
              onClick={() => setMode('add-label')}
              aria-label={t('addTo', {group: group.name})}
              className={ACTION}
            >
              <Plus aria-hidden="true" size={16} />
            </button>
            <button
              ref={editButton}
              type="button"
              onClick={() => setMode('edit')}
              aria-label={t('editGroupLabel', {name: group.name})}
              className={ACTION}
            >
              <Pencil aria-hidden="true" size={16} />
            </button>
            <button
              ref={deleteButton}
              type="button"
              onClick={() => setMode('confirm-delete')}
              aria-label={t('deleteGroupLabel', {name: group.name})}
              className="flex size-8 items-center justify-center rounded-lg border border-primary-strong text-primary-strong"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </>
        )}
      </div>

      {mode === 'add-label' && (
        <NewLabelForm
          groupId={group.id}
          groupName={group.name}
          onCancel={close(addButton)}
        />
      )}
      {mode === 'edit' && (
        <RenameGroupForm group={group} onClose={close(editButton)} />
      )}
      {mode === 'confirm-delete' && (
        <DeleteGroupConfirm group={group} onCancel={close(deleteButton)} />
      )}
    </div>
  )
}
