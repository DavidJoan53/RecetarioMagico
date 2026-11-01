'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useEffect, useId, useRef, useState} from 'react'
import type {
  IngredientPage,
  IngredientWithPantry,
} from '@/db/ingredients/queries'

type Props = {
  value: IngredientWithPantry | null
  onChange: (ingredient: IngredientWithPantry | null) => void
}

/** Long enough that typing a word is one request, short enough to feel live. */
const DEBOUNCE_MS = 250

async function fetchPage(query: string, after: string | null) {
  const params = new URLSearchParams({query})
  if (after) params.set('after', after)
  const response = await fetch(`/api/ingredients?${params}`)
  if (!response.ok) throw new Error('search failed')
  return response.json() as Promise<IngredientPage>
}

/**
 * The WAI-ARIA combobox pattern. The input keeps focus throughout and the
 * active option is pointed at with aria-activedescendant, so arrowing the
 * list never moves focus away from what is being typed.
 */
export function IngredientCombobox({value, onChange}: Props) {
  const t = useTranslations('pantry')
  const common = useTranslations('common')
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
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
      queryKey: ['ingredients', query],
      queryFn: ({pageParam}) => fetchPage(query, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      enabled: open,
    })

  const options = data?.pages.flatMap(page => page.items) ?? []

  /* One live region, so the two things worth hearing cannot talk over each
     other: that more is coming, then how much there is. */
  const announcement = (() => {
    if (!open || isPending) return ''
    if (isFetchingNextPage) return common('loadingMore')
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

  function choose(ingredient: IngredientWithPantry) {
    onChange(ingredient)
    setText(ingredient.name)
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
        {t('ingredient')}
      </label>

      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? optionId(active) : undefined}
        placeholder={t('searchPlaceholder')}
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
          aria-label={t('ingredient')}
          className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-secondary-foreground bg-background"
        >
          {options.map((ingredient, index) => (
            <div
              key={ingredient.id}
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              onMouseDown={event => {
                /* Before blur, or the list closes and the click lands on
                   nothing. */
                event.preventDefault()
                choose(ingredient)
              }}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                index === active ? 'bg-background-foreground' : ''
              }`}
            >
              <span className="truncate">{ingredient.name}</span>
              {ingredient.inPantry && (
                <span className="shrink-0 text-secondary-foreground text-xs">
                  {t('alreadyIn')}
                </span>
              )}
            </div>
          ))}

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
              {common('loadingMore')}
            </div>
          )}

          {options.length === 0 && !isPending && (
            <div className="px-3 py-2 text-center text-secondary-foreground text-sm">
              {t('noMatches')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
