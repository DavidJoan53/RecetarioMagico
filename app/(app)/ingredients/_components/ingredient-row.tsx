'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import {DeleteConfirm} from './delete-confirm'
import {IngredientEditForm} from './ingredient-edit-form'

type Mode = 'view' | 'edit' | 'confirm-delete'

type Props = {
  ingredient: IngredientWithPantry
  /** Trailing slot — the pantry control lands here. */
  children?: React.ReactNode
}

export function IngredientRow({ingredient, children}: Props) {
  const t = useTranslations('ingredients')
  const [mode, setMode] = useState<Mode>('view')
  const editButton = useRef<HTMLButtonElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const restoreTo = useRef<React.RefObject<HTMLButtonElement | null>>(null)

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
          <IngredientEditForm
            ingredient={ingredient}
            onDone={close(editButton)}
            onCancel={close(editButton)}
          />
        ) : (
          <DeleteConfirm
            ingredient={ingredient}
            onCancel={close(deleteButton)}
          />
        )}
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-2">
      {ingredient.photoUrl ? (
        /* Not next/image: the host is whatever the user pasted, and
           remotePatterns only allows the YouTube thumbnail domain. */
        <img
          src={ingredient.photoUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="size-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span aria-hidden className="size-10 shrink-0 rounded-md bg-light" />
      )}

      <span className="min-w-0 flex-1 truncate font-semibold text-sm">
        {ingredient.name}
      </span>

      {children}

      {/* Named per row: a column of buttons all reading "Editar" tells a
          screen reader user nothing about which one they are on. */}
      <button
        ref={editButton}
        type="button"
        onClick={() => setMode('edit')}
        aria-label={t('editLabel', {name: ingredient.name})}
        className="rounded-lg border border-secondary-foreground px-3 py-1 font-semibold text-sm"
      >
        {t('edit')}
      </button>

      <button
        ref={deleteButton}
        type="button"
        onClick={() => setMode('confirm-delete')}
        aria-label={t('deleteLabel', {name: ingredient.name})}
        className="rounded-lg border border-primary-strong px-3 py-1 font-semibold text-primary-strong text-sm"
      >
        {t('delete')}
      </button>
    </li>
  )
}
