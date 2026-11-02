'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {DeletionAnnouncer} from '@/components/deletion-announcer'
import {LoadMore} from '@/components/load-more'
import type {IngredientPage} from '@/db/ingredients/queries'
import {queryKeys} from '@/lib/query-keys'
import {IngredientRow} from './ingredient-row'

async function fetchPage(after: string | null) {
  const params = new URLSearchParams()
  if (after) params.set('after', after)
  const response = await fetch(`/api/ingredients?${params}`)
  if (!response.ok) throw new Error('ingredients failed')
  return response.json() as Promise<IngredientPage>
}

/**
 * Pages are appended, never replaced, so reading on does not take the list
 * back to the top.
 */
export function IngredientPages({initialPage}: {initialPage: IngredientPage}) {
  const t = useTranslations('ingredients')

  const {data, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useInfiniteQuery({
      /* The empty search: the same endpoint the combobox pages through, so
         adding one here is a change the picker sees too. */
      queryKey: [...queryKeys.ingredients, ''],
      queryFn: ({pageParam}) => fetchPage(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      /* The server rendered the first page, so it paints with the document. */
      initialData: {pages: [initialPage], pageParams: [null]},
      /* Stale on arrival, so nothing added since the render is missing with
         no sign of it. */
      staleTime: 0,
    })

  const list = data.pages.flatMap(page => page.items)

  return (
    <DeletionAnnouncer>
      <ul aria-label={t('listLabel')} className="flex flex-col gap-2">
        {list.map(ingredient => (
          <IngredientRow key={ingredient.id} ingredient={ingredient} />
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
