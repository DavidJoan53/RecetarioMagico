'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {PantryItem} from '@/db/pantry/queries'
import {PantryAmountForm} from './pantry-amount-form'
import {RemoveFromPantryButton} from './remove-from-pantry-button'

export function PantryRow({item}: {item: PantryItem}) {
  const t = useTranslations('pantry')
  const [editing, setEditing] = useState(false)
  const amountButton = useRef<HTMLButtonElement>(null)
  const restore = useRef(false)

  /** Focus waits for the render: the button is gone while the form is open. */
  useEffect(() => {
    if (editing || !restore.current) return
    restore.current = false
    amountButton.current?.focus()
  }, [editing])

  const close = useCallback(() => {
    restore.current = true
    setEditing(false)
  }, [])

  if (editing) {
    return (
      <li className="rounded-lg border border-light bg-background-foreground p-4">
        <PantryAmountForm item={item} onDone={close} onCancel={close} />
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-2">
      <span className="min-w-0 flex-1 truncate font-semibold text-sm">
        {item.name}
      </span>

      {/* The amount is the button: there is nothing else to press it for. */}
      <button
        ref={amountButton}
        type="button"
        onClick={() => setEditing(true)}
        aria-label={t('amountFor', {name: item.name})}
        className="rounded-lg border border-secondary-foreground px-3 py-1 text-sm"
      >
        {item.quantity === null
          ? t('noAmount')
          : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}
      </button>

      <RemoveFromPantryButton item={item} />
    </li>
  )
}
