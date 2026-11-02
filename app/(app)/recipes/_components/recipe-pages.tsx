'use client'

import {useInfiniteQuery} from '@tanstack/react-query'
import {LoadMore} from '@/components/load-more'
import {RecipeCard} from '@/components/recipe-card'
import type {RecipePage} from '@/db/recipes/queries'

async function fetchPage(after: string | null) {
  const params = new URLSearchParams()
  if (after) params.set('after', after)
  const response = await fetch(`/api/recipes?${params}`)
  if (!response.ok) throw new Error('recipes failed')
  return response.json() as Promise<RecipePage>
}

/**
 * Pages are appended, never replaced, so reading on does not take the list
 * back to the top the way a page of links would.
 */
export function RecipePages({initialPage}: {initialPage: RecipePage}) {
  const {data, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useInfiniteQuery({
      queryKey: ['recipes'],
      queryFn: ({pageParam}) => fetchPage(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: page => page.nextCursor,
      /* The server already rendered the first page, so it paints at once
         rather than flashing a skeleton the client then fills. */
      initialData: {pages: [initialPage], pageParams: [null]},
      /* Stale on arrival: a recipe added since this cache was filled is
         otherwise missing until the cache expires, with nothing to say so. */
      staleTime: 0,
    })

  const recipes = data.pages.flatMap(page => page.items)

  return (
    <>
      <ul className="flex flex-col gap-2">
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            name={recipe.name}
            imageUrl={recipe.imageUrl}
            prepTimeMinutes={recipe.prepTimeMinutes}
            ingredients={recipe.ingredients}
          />
        ))}
      </ul>

      <LoadMore
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </>
  )
}
