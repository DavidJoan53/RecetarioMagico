'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {PAGE_SIZE} from '@/lib/validation/page'

type Props = {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}

/**
 * The end of a paged list. It loads the next page when it is scrolled to,
 * and it is a real button so that reaching it is possible at all without a
 * mouse — an observer on its own leaves anyone who tabs through the page
 * with nothing to press and no sign there is more.
 */
export function LoadMore({hasMore, isLoading, onLoadMore}: Props) {
  const t = useTranslations('common')
  const button = useRef<HTMLButtonElement>(null)
  const end = useRef<HTMLParagraphElement>(null)
  const pressed = useRef(false)
  const [reachedEnd, setReachedEnd] = useState(false)

  useEffect(() => {
    const target = button.current
    if (!target || !hasMore) return
    /* No rootMargin. Rooted to the viewport, any margin large enough to be
       worth having also reaches the button before anyone scrolls: ten recipe
       cards end 88px below the fold on a 720px-tall window, so a page of ten
       would quietly arrive as twenty. Reaching it is what asks. */
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) onLoadMore()
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  /* The button leaves with the last page. Pressed, that drops focus to the
     body and the page loses its place, so something stays to catch it. */
  useEffect(() => {
    if (!hasMore && pressed.current) setReachedEnd(true)
  }, [hasMore])

  useEffect(() => {
    if (reachedEnd) end.current?.focus()
  }, [reachedEnd])

  /* Scrolled to the end, or never had more: nothing to say. */
  if (!hasMore && !reachedEnd) return null

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {hasMore ? (
        <button
          ref={button}
          type="button"
          /* aria-disabled, not disabled: a disabled button is dropped from
             the tab order, taking focus with it, and whoever just pressed
             it is left at the top of the document. */
          aria-disabled={isLoading}
          onClick={() => {
            pressed.current = true
            onLoadMore()
          }}
          className="rounded-lg border border-secondary-foreground px-3 py-2 font-semibold text-sm aria-disabled:opacity-60"
        >
          {isLoading ? t('loadingMore') : t('loadMore', {count: PAGE_SIZE})}
        </button>
      ) : (
        <p
          ref={end}
          tabIndex={-1}
          className="text-secondary-foreground text-sm"
        >
          {t('endOfList')}
        </p>
      )}

      {/* Loading is otherwise only a change of wording on a button. */}
      <p role="status" className="sr-only">
        {isLoading ? t('loadingMore') : ''}
      </p>
    </div>
  )
}
