'use client'

import {createContext, useCallback, useContext, useRef, useState} from 'react'

const Announce = createContext<(message: string) => void>(() => {})

export const useAnnounceDeletion = () => useContext(Announce)

/**
 * A deleted row unmounts and focus falls to the body: the page loses its
 * place and a screen reader says nothing happened. This catches focus on the
 * list and says what went.
 */
export function DeletionAnnouncer({children}: {children: React.ReactNode}) {
  const [message, setMessage] = useState('')
  const list = useRef<HTMLDivElement>(null)

  const announce = useCallback((text: string) => {
    setMessage(text)
    list.current?.focus()
  }, [])

  return (
    <Announce.Provider value={announce}>
      {/* Somewhere for focus to land when the row it was on disappears. */}
      <div ref={list} tabIndex={-1}>
        {children}
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </Announce.Provider>
  )
}
