'use client'

import {Plus} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {PageHeader} from '@/components/page-header'
import type {FormState} from '../actions'
import {IngredientForm} from './ingredient-form'

type Props = {
  title: string
  action: (state: FormState, form: FormData) => Promise<FormState>
}

/**
 * The page's heading and the form it can open.
 *
 * Both live here because the plus is in the header and the form is below it:
 * split across two components, neither could own whether it is open.
 */
export function AddIngredient({title, action}: Props) {
  const t = useTranslations('ingredients')
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const restore = useRef(false)

  /** Focus waits for the render: the plus does not exist while the form is. */
  useEffect(() => {
    if (open || !restore.current) return
    restore.current = false
    trigger.current?.focus()
  }, [open])

  return (
    <>
      <PageHeader
        title={title}
        actions={
          !open && (
            <button
              ref={trigger}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('addTitle')}
              className="flex size-8 items-center justify-center rounded-lg bg-primary-strong text-white"
            >
              <Plus aria-hidden="true" size={16} />
            </button>
          )
        }
      />

      {open && (
        <IngredientForm
          action={action}
          onCancel={() => {
            restore.current = true
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
