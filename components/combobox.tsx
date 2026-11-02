'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useEffect, useId, useRef, useState} from 'react'
import type {Page} from '@/lib/validation/page'

type Props<T> = {
  /** Already translated: what this picks is the caller's vocabulary. */
  label: string
  placeholder: string
  /** Shown when the search matched nothing. Worth naming what was searched. */
  emptyMessage: string
  value: T | null
  onChange: (item: T | null) => void
  /** The search text is appended, so each search caches on its own. */
  queryKey: readonly unknown[]
  fetchPage: (query: string, after: string | null) => Promise<Page<T>>
  getKey: (item: T) => string
  getLabel: (item: T) => string
  /** A note after the name — "already in the pantry" and the like. */
  renderNote?: (item: T) => React.ReactNode
}

/** Long enough that typing a word is one request, short enough to feel live. */
const DEBOUNCE_MS = 250

/**
 * The WAI-ARIA combobox pattern over a paged search. The input keeps focus
 * throughout and the active option is pointed at with aria-activedescendant,
 * so arrowing the list never moves focus away from what is being typed.
 *
 * Pages are appended as the bottom of the list is reached, and the list stays
 * where it was while they arrive.
 */
export function Combobox<T>({
  label,
  placeholder,
  emptyMessage,
  value,
  onChange,
  queryKey,
  fetchPage,
  getKey,
  getLabel,
  renderNote,
}: Props<T>) {
  const t = useTranslations('common')
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const listId = useId()
  const optionId = (index: number) => `${listId}-${index}`

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])

  const {data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending} =
    useInfiniteQuery({
      queryKey: [...queryKey, query],
      queryFn: ({pageParam}) => fetchPage(query, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      /* Or every page carrying one of these searches on first paint. */
      enabled: open,
    })

  const options = data?.pages.flatMap(page => page.items) ?? []

  /* One live region, so the things worth hearing cannot talk over each
     other: that it is looking, that more is coming, then how much there is. */
  const announcement = (() => {
    if (!open) return ''
    if (isPending) return t('loading')
    if (isFetchingNextPage) return t('loadingMore')
    return t('resultCount', {count: options.length})
  })()

  /* Loads the next page when the bottom of the list is reached, rather than
     on a button nobody finds while scrolling. */
  useEffect(() => {
    const target = sentinel.current
    if (!target || !hasNextPage) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      /* Rooted to the list, not the viewport. Without this the sentinel
         counts as visible the moment the box opens and every page loads at
         once, which is a long list arriving rather than paging.

         The margin asks slightly early, so the next page is on its way
         before the last option is reached. Ten options are far taller than
         the list box, so it still cannot reach at scroll-top. */
      {root: listRef.current, rootMargin: '50px'},
    )
    observer.observe(target)
    return () => observer.disconnect()
    /* open, because closing unmounts the list and the sentinel with it. A
       reopened list is a new sentinel, and the observer still holding the
       old one watches a node that is no longer on the page. */
  }, [open, hasNextPage, fetchNextPage])

  /**
   * Keeps the active option in view when it is reached with the keyboard.
   * Only when the active one moves: on every render this also fired as a page
   * arrived, scrolling back to whichever option was active — usually the
   * first — so reaching the bottom threw you to the top.
   */
  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`#${CSS.escape(`${listId}-${active}`)}`)
      ?.scrollIntoView({block: 'nearest'})
  }, [active, open, listId])

  function choose(item: T) {
    onChange(item)
    setText(getLabel(item))
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(current => {
        const next = current + step
        if (next < 0) return options.length - 1
        return next >= options.length ? 0 : next
      })
      return
    }
    if (event.key === 'Enter' && open) {
      const chosen = options[active]
      if (chosen) {
        event.preventDefault()
        choose(chosen)
      }
    }
  }

  return (
    <div className="relative flex flex-col gap-1">
      <label className="font-semibold text-sm" htmlFor={`${listId}-input`}>
        {label}
      </label>

      <input
        id={`${listId}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        /* Only when there is one to point at. Open with nothing in the list
           — loading, or nothing matched — this named an element that does
           not exist. */
        aria-activedescendant={
          open && options[active] ? optionId(active) : undefined
        }
        placeholder={placeholder}
        value={text}
        onChange={event => {
          setText(event.target.value)
          setActive(0)
          setOpen(true)
          if (value) onChange(null)
        }}
        onFocus={() => setOpen(true)}
        /* Focus alone is not enough: after Escape the field still has it, so
           nothing fires and clicking the box appears to do nothing. */
        onClick={() => setOpen(true)}
        /* Leaving closes it. Clicks inside the list cancel their own mousedown
           so focus never leaves, which is why this does not eat them. */
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="rounded-lg border border-secondary-foreground bg-background px-3 py-2"
      />

      {/* Counted out loud, because the list appearing is a visual event. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {open && (
        /* div, not ul: a list carrying listbox semantics is announced twice,
           once as a list and once as a listbox. */
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          /* Keeps focus in the input while the list is being used. Without it,
             dragging the scrollbar blurs the field and closes what is being
             scrolled. */
          onMouseDown={event => event.preventDefault()}
          className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-secondary-foreground bg-background"
        >
          {isPending && (
            /* The first page. Without it the box opens two pixels tall and
               empty, which reads as "nothing here" rather than "coming". */
            <div role="presentation" className="px-3 py-2 text-center text-sm">
              {t('loading')}
            </div>
          )}

          {options.map((item, index) => {
            const note = renderNote?.(item)
            return (
              <div
                key={getKey(item)}
                id={optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                onMouseDown={event => {
                  /* Before blur, or the list closes and the click lands on
                     nothing. */
                  event.preventDefault()
                  choose(item)
                }}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                  index === active ? 'bg-background-foreground' : ''
                }`}
              >
                <span className="truncate">{getLabel(item)}</span>
                {note && (
                  <span className="shrink-0 text-secondary-foreground text-xs">
                    {note}
                  </span>
                )}
              </div>
            )
          })}

          {hasNextPage && (
            /* Watched, not read: reaching it asks for the next page. The row
               below says when that is happening, and a row that said so
               while idle would be claiming to work when it is not. */
            <div ref={sentinel} role="presentation" className="h-px" />
          )}

          {isFetchingNextPage && (
            /* presentation, not option: it is a loading marker, and counting
               it would make the list one longer than it is. */
            <div role="presentation" className="px-3 py-2 text-center text-sm">
              {t('loadingMore')}
            </div>
          )}

          {options.length === 0 && !isPending && (
            <div className="px-3 py-2 text-center text-secondary-foreground text-sm">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
