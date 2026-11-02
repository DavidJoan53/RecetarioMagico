'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {FocusCatcher} from '@/components/focus-catcher'
import {LoadMore} from '@/components/load-more'
import type {DinnerPage} from '@/db/dinners/queries'
import {queryKeys} from '@/lib/query-keys'
import {DinnerRow} from './dinner-row'

async function fetchPage(after: string | null) {
  const params = new URLSearchParams()
  if (after) params.set('after', after)
  const response = await fetch(`/api/dinners?${params}`)
  if (!response.ok) throw new Error('dinners failed')
  return response.json() as Promise<DinnerPage>
}

/**
 * Pages are appended, never replaced, so reading on does not take the list
 * back to the top.
 */
export function DinnerPages({initialPage}: {initialPage: DinnerPage}) {
  const t = useTranslations('dinners')

  const {data, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useInfiniteQuery({
      queryKey: queryKeys.dinners,
      queryFn: ({pageParam}) => fetchPage(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      /* The server rendered the first page, so it paints with the document. */
      initialData: {pages: [initialPage], pageParams: [null]},
      /* Stale on arrival, so a dinner logged since the render is not missing
         with nothing to say so. */
      staleTime: 0,
    })

  const dinners = data.pages.flatMap(page => page.items)

  return (
    <FocusCatcher>
      <ul aria-label={t('listLabel')} className="flex flex-col gap-2">
        {dinners.map(dinner => (
          <DinnerRow key={dinner.id} dinner={dinner} />
        ))}
      </ul>

      <LoadMore
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </FocusCatcher>
  )
}
