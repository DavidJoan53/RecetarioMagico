'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {Ingredient} from '@/db/schema'
import {IngredientEditForm} from './ingredient-edit-form'

type Props = {
  ingredient: Ingredient
  /** Trailing slot — the pantry control lands here. */
  children?: React.ReactNode
}

export function IngredientRow({ingredient, children}: Props) {
  const t = useTranslations('ingredients')
  const [editing, setEditing] = useState(false)
  const editButton = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)

  /**
   * Focus waits for the render. The button does not exist while the form is
   * open, so asking for it in the same tick finds nothing and the page
   * quietly loses its place.
   */
  useEffect(() => {
    if (editing || !restoreFocus.current) return
    restoreFocus.current = false
    editButton.current?.focus()
  }, [editing])

  const close = useCallback(() => {
    restoreFocus.current = true
    setEditing(false)
  }, [])

  if (editing) {
    return (
      <li className="rounded-lg border border-light bg-background-foreground p-4">
        <IngredientEditForm
          ingredient={ingredient}
          onDone={close}
          onCancel={close}
        />
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
        onClick={() => setEditing(true)}
        aria-label={t('editLabel', {name: ingredient.name})}
        className="rounded-lg border border-secondary-foreground px-3 py-1 font-semibold text-sm"
      >
        {t('edit')}
      </button>
    </li>
  )
}
