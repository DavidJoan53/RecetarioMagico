'use client'

import {createContext, useCallback, useContext, useRef, useState} from 'react'
import {durationFor, type Toast, type ToastInput} from '@/lib/toast'
import {ToastItem} from './toast-item'

const Raise = createContext<(input: ToastInput) => void>(() => {})

/** Raises a toast. Says whether a write landed, never what a field is. */
export const useToast = () => useContext(Raise)

/** What a region is currently saying, keyed so a repeat is still a change. */
type Said = {id: number; text: string}

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [polite, setPolite] = useState<Said | null>(null)
  const [assertive, setAssertive] = useState<Said | null>(null)
  const nextId = useRef(0)

  const raise = useCallback((input: ToastInput) => {
    const tone = input.tone ?? 'success'
    const id = nextId.current++
    setToasts(current => [
      ...current,
      {
        id,
        message: input.message,
        tone,
        duration: durationFor(tone, input.duration),
      },
    ])
    /* A failure interrupts; a success waits for a gap. */
    if (tone === 'error') setAssertive({id, text: input.message})
    else setPolite({id, text: input.message})
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  return (
    <Raise.Provider value={raise}>
      {children}

      {/*
        Both regions are mounted for the life of the app and start empty: a
        live region that arrives with its text already inside is routinely
        never announced at all.

        The text lives here rather than on the visible toast because the toast
        also holds a button, and a region wrapping one reads out its name too.
        The toast's own paragraph is aria-hidden to match.

        Keyed by id so that two identical messages in a row are two mutations.
        Setting the same string changes no node, and nothing is said twice.
      */}
      <div role="status" className="sr-only">
        {polite && <span key={polite.id}>{polite.text}</span>}
      </div>
      <div role="alert" className="sr-only">
        {assertive && <span key={assertive.id}>{assertive.text}</span>}
      </div>

      {/* Clear of the tab bar, and transparent to pointers except on a toast
          itself, so what is underneath stays clickable. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-2xl flex-col gap-2 px-4 pt-4 pb-20">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </Raise.Provider>
  )
}
