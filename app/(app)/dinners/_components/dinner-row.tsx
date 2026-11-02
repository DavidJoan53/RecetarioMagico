'use client'

import {useFormatter, useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {DinnerListItem} from '@/lib/dinners'
import {DeleteConfirm} from './delete-confirm'
import {DinnerEditForm} from './dinner-edit-form'

type Mode = 'view' | 'edit' | 'confirm-delete'

export function DinnerRow({dinner}: {dinner: DinnerListItem}) {
  const t = useTranslations('dinners')
  const format = useFormatter()
  const [mode, setMode] = useState<Mode>('view')
  const editButton = useRef<HTMLButtonElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const restoreTo = useRef<React.RefObject<HTMLButtonElement | null>>(null)

  /* Formatted against the configured zone on both sides of hydration, so the
     server's rendering of it and the browser's agree. */
  const eatenAt = new Date(dinner.eatenAt)
  const date = format.dateTime(eatenAt, {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  /**
   * Focus waits for the render. The buttons do not exist while a form is
   * open, so asking for one in the same tick finds nothing and the page
   * quietly loses its place.
   */
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

  if (mode !== 'view') {
    return (
      <li className="rounded-lg border border-light bg-background-foreground p-4">
        {mode === 'edit' ? (
          <DinnerEditForm
            dinner={dinner}
            date={date}
            onDone={close(editButton)}
            onCancel={close(editButton)}
          />
        ) : (
          <DeleteConfirm
            id={dinner.id}
            date={date}
            onCancel={close(deleteButton)}
          />
        )}
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-light bg-background-foreground p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* A machine-readable instant beside the words, so the date is not
              only readable as whatever this locale renders. */}
          <time dateTime={dinner.eatenAt} className="font-semibold text-sm">
            {date}
          </time>
          <p className="text-secondary-foreground text-xs">
            {dinner.notes ?? t('noNotes')}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {/* Named per row: a column of buttons all reading "Editar" tells a
              screen reader user nothing about which one they are on. */}
          <button
            ref={editButton}
            type="button"
            onClick={() => setMode('edit')}
            aria-label={t('editLabel', {date})}
            className="rounded-lg border border-secondary-foreground px-3 py-1 font-semibold text-sm"
          >
            {t('edit')}
          </button>
          <button
            ref={deleteButton}
            type="button"
            onClick={() => setMode('confirm-delete')}
            aria-label={t('deleteLabel', {date})}
            className="rounded-lg border border-primary-strong px-3 py-1 font-semibold text-primary-strong text-sm"
          >
            {t('delete')}
          </button>
        </div>
      </div>

      {/* Named after its dinner: a page of lists all called "Recetas" says
          nothing about which evening is being read. */}
      {dinner.recipes.length > 0 && (
        <ul
          aria-label={t('recipesOn', {date})}
          className="flex flex-wrap gap-2"
        >
          {dinner.recipes.map(recipe => (
            <li
              key={recipe.id}
              className="rounded-full border border-light bg-background px-3 py-1 text-sm"
            >
              {recipe.name}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
