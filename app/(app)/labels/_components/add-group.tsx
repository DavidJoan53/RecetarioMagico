'use client'

import {Plus} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {PageHeader} from '@/components/page-header'
import {NewGroupForm} from './new-group-form'

/**
 * The page's heading and the form it can open.
 *
 * Both live here because the plus is in the header and the form is below it:
 * split across two components, neither could own whether it is open.
 */
export function AddGroup({title}: {title: string}) {
  const t = useTranslations('labels')
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
              aria-label={t('newGroup')}
              className="flex size-8 items-center justify-center rounded-lg bg-primary-strong text-white"
            >
              <Plus aria-hidden="true" size={16} />
            </button>
          )
        }
      />

      {open && (
        <NewGroupForm
          onCancel={() => {
            restore.current = true
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
