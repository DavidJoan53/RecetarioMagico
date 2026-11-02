'use client'

import {X} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {Toast} from '@/lib/toast'

/** Dragged past this, letting go dismisses; short of it, it springs back. */
const DISMISS_AT = 96

/** Movement before a press counts as a drag, so a tap on × stays a tap. */
const SLOP = 6

/** Matches the leave transition, after which the toast is unmounted. */
const LEAVE_MS = 150

type Props = {
  toast: Toast
  onDismiss: (id: number) => void
}

export function ToastItem({toast, onDismiss}: Props) {
  const t = useTranslations('toast')
  const [leaving, setLeaving] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false)
  /* What is left of the countdown. Carried across pauses, so a toast hovered
     at four seconds does not start its five again on leaving. */
  const remaining = useRef(toast.duration)
  const startX = useRef(0)
  const pressed = useRef(false)

  const leave = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), LEAVE_MS)
  }, [onDismiss, toast.id])

  useEffect(() => {
    if (remaining.current === null || paused || leaving) return
    const startedAt = Date.now()
    const timer = setTimeout(leave, remaining.current)
    return () => {
      clearTimeout(timer)
      /* Clearing is also what a pause is, so the balance is banked here
         rather than in the handler that caused it. */
      if (remaining.current !== null) {
        remaining.current = Math.max(
          0,
          remaining.current - (Date.now() - startedAt),
        )
      }
    }
  }, [paused, leaving, leave])

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    /* Right and middle buttons do not drag; neither does anything that is
       not the press itself. */
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pressed.current = true
    startX.current = event.clientX
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressed.current) return
    const moved = event.clientX - startX.current
    /* Capture is taken only once this is a drag. Taken on the press instead,
       it swallows the click on × — the button never sees it. */
    if (!dragging) {
      if (Math.abs(moved) < SLOP) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    /* Rightwards only: there is nothing to the left to dismiss towards. */
    setDragX(Math.max(0, moved))
  }

  function onPointerUp() {
    if (!pressed.current) return
    pressed.current = false
    setDragging(false)
    if (dragX > DISMISS_AT) leave()
    else setDragX(0)
  }

  const tone =
    toast.tone === 'error'
      ? 'bg-primary-strong text-white'
      : 'bg-secondary text-background'

  return (
    /* The gesture is an addition to the dismiss button, never the only way
       out: a drag is unreachable by keyboard and by most assistive tech. */
    <div
      data-testid={`toast-${toast.id}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      /* The countdown holds while it is being read or reached into. */
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      style={dragX ? {transform: `translateX(${dragX}px)`} : undefined}
      className={`pointer-events-auto flex touch-pan-y items-start gap-3 rounded-lg px-4 py-3 shadow-lg ${tone} ${
        leaving ? 'translate-x-full opacity-0' : 'animate-toast-in'
      } ${dragging ? 'transition-none' : 'transition'} motion-reduce:animate-none motion-reduce:transition-none`}
    >
      {/* Hidden from assistive tech: the provider's live region is what says
          this, and reading it here too would say everything twice. */}
      <p aria-hidden="true" className="min-w-0 flex-1 text-sm">
        {toast.message}
      </p>

      {/* Named after what it discards: a stack of buttons all reading
          "Descartar" says nothing about which one is which. */}
      <button
        type="button"
        onClick={leave}
        aria-label={t('dismiss', {message: toast.message})}
        className="-m-2 flex-none p-2"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
