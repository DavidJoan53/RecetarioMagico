'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import {LabelChip} from '@/components/label-chip'
import type {LabelWithUsage} from '@/lib/labels'
import {LabelEditForm} from './label-edit-form'

type Mode = 'view' | 'edit'

export function LabelItem({label}: {label: LabelWithUsage}) {
  const t = useTranslations('labels')
  const [mode, setMode] = useState<Mode>('view')
  const chip = useRef<HTMLButtonElement>(null)
  const restore = useRef(false)

  /** Focus waits for the render: the chip does not exist while editing. */
  useEffect(() => {
    if (mode !== 'view' || !restore.current) return
    restore.current = false
    chip.current?.focus()
  }, [mode])

  const close = useCallback(() => {
    restore.current = true
    setMode('view')
  }, [])

  if (mode === 'edit') {
    return (
      <li className="w-full rounded-lg border border-light bg-background p-3">
        <LabelEditForm label={label} onDone={close} onCancel={close} />
      </li>
    )
  }

  return (
    <li>
      {/* The chip is the control. A row of separate pencil icons would
          double the number of things to tab through for no gain. */}
      <button
        ref={chip}
        type="button"
        onClick={() => setMode('edit')}
        aria-label={t('editLabel', {name: label.name})}
        className="rounded-full"
      >
        <LabelChip label={label} />
      </button>
    </li>
  )
}
