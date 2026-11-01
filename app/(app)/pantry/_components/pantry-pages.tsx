'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {DeletionAnnouncer} from '@/components/deletion-announcer'
import {LoadMore} from '@/components/load-more'
import type {PantryPage} from '@/db/pantry/queries'
import {queryKeys} from '@/lib/query-keys'
import {PantryRow} from './pantry-row'

async function fetchPage(after: string | null) {
  const params = new URLSearchParams()
  if (after) params.set('after', after)
  const response = await fetch(`/api/pantry?${params}`)
  if (!response.ok) throw new Error('pantry failed')
  return response.json() as Promise<PantryPage>
}

/**
 * Pages are appended, never replaced, so reading on does not take the list
 * back to the top.
 */
export function PantryPages({initialPage}: {initialPage: PantryPage}) {
  const t = useTranslations('pantry')

  const {data, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useInfiniteQuery({
      queryKey: queryKeys.pantry,
      queryFn: ({pageParam}) => fetchPage(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      /* The server rendered the first page, so it paints with the document. */
      initialData: {pages: [initialPage], pageParams: [null]},
      /* Stale on arrival: something added from /pantry/add since this cache
         was filled is otherwise missing with nothing to say so. */
      staleTime: 0,
    })

  const items = data.pages.flatMap(page => page.items)

  return (
    <DeletionAnnouncer>
      <ul aria-label={t('title')} className="flex flex-col gap-2">
        {items.map(item => (
          <PantryRow key={item.ingredientId} item={item} />
        ))}
      </ul>

      <LoadMore
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </DeletionAnnouncer>
  )
}
