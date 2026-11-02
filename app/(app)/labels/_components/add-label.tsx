'use client'

import {Plus} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {NewLabelForm} from './new-label-form'

type Props = {
  groupId: string
  groupName: string
}

/**
 * The way to add a label to a group: a plus, which becomes the form.
 *
 * Closed by default. A page of groups each carrying an open name-and-colour
 * form put four controls between one group's labels and the next, which is
 * the thing most people are there to read.
 */
export function AddLabel({groupId, groupName}: Props) {
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

  if (open) {
    return (
      <NewLabelForm
        groupId={groupId}
        groupName={groupName}
        onCancel={() => {
          restore.current = true
          setOpen(false)
        }}
      />
    )
  }

  return (
    <button
      ref={trigger}
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t('addTo', {group: groupName})}
      className="flex size-11 items-center justify-center self-start rounded-lg border border-secondary-foreground"
    >
      <Plus aria-hidden="true" size={18} />
    </button>
  )
}
