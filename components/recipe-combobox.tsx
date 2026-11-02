'use client'

import {useTranslations} from 'next-intl'
import type {Recipe, RecipePage} from '@/db/recipes/queries'
import {queryKeys} from '@/lib/query-keys'
import {Combobox} from './combobox'

type Props = {
  onChange: (recipe: Recipe | null) => void
  /** Already chosen, marked rather than hidden. */
  isChosen?: (recipe: Recipe) => boolean
}

async function fetchPage(query: string, after: string | null) {
  const params = new URLSearchParams({query})
  if (after) params.set('after', after)
  const response = await fetch(`/api/recipes?${params}`)
  if (!response.ok) throw new Error('search failed')
  return response.json() as Promise<RecipePage>
}

/**
 * Picks one recipe at a time out of the whole list, and keeps nothing: what
 * was chosen is shown by whoever asked, so the box goes back to empty ready
 * for the next one.
 *
 * Recipes already on the dinner stay in the list and are marked. Hiding them
 * makes "not written down yet" and "already added" look identical.
 */
export function RecipeCombobox({onChange, isChosen}: Props) {
  const t = useTranslations('dinners')

  return (
    <Combobox<Recipe>
      label={t('recipes')}
      placeholder={t('searchPlaceholder')}
      emptyMessage={t('noMatches')}
      value={null}
      onChange={onChange}
      queryKey={queryKeys.recipes}
      fetchPage={fetchPage}
      getKey={recipe => recipe.id}
      getLabel={recipe => recipe.name}
      renderNote={recipe => (isChosen?.(recipe) ? t('alreadyAdded') : null)}
      clearOnSelect
    />
  )
}
