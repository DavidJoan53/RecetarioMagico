'use client'

import {createContext, useCallback, useContext, useRef} from 'react'

const Catch = createContext<() => void>(() => {})

/**
 * Takes focus onto the list, for a handler whose own row is unmounting.
 *
 * Only about where the page's place goes. What happened is a toast's job —
 * a toast deliberately does not take focus, so it cannot do this one.
 */
export const useCatchFocus = () => useContext(Catch)

export function FocusCatcher({children}: {children: React.ReactNode}) {
  const list = useRef<HTMLDivElement>(null)
  const take = useCallback(() => list.current?.focus(), [])

  return (
    <Catch.Provider value={take}>
      {/* Somewhere for focus to land when the row it was on disappears.
          Without it focus falls to the body and the page loses its place. */}
      <div ref={list} tabIndex={-1}>
        {children}
      </div>
    </Catch.Provider>
  )
}
