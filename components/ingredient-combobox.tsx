'use client'

import {useTranslations} from 'next-intl'
import type {
  IngredientPage,
  IngredientWithPantry,
} from '@/db/ingredients/queries'
import {queryKeys} from '@/lib/query-keys'
import {Combobox} from './combobox'

type Props = {
  value: IngredientWithPantry | null
  onChange: (ingredient: IngredientWithPantry | null) => void
}

async function fetchPage(query: string, after: string | null) {
  const params = new URLSearchParams({query})
  if (after) params.set('after', after)
  const response = await fetch(`/api/ingredients?${params}`)
  if (!response.ok) throw new Error('search failed')
  return response.json() as Promise<IngredientPage>
}

/**
 * What this one knows that the combobox does not: where ingredients come
 * from, and that the ones already in the pantry are marked rather than
 * hidden — hiding them makes "it is not in the list" and "you already have
 * it" look alike.
 */
export function IngredientCombobox({value, onChange}: Props) {
  const t = useTranslations('pantry')

  return (
    <Combobox
      label={t('ingredient')}
      placeholder={t('searchPlaceholder')}
      emptyMessage={t('noMatches')}
      value={value}
      onChange={onChange}
      queryKey={queryKeys.ingredients}
      fetchPage={fetchPage}
      getKey={ingredient => ingredient.id}
      getLabel={ingredient => ingredient.name}
      renderNote={ingredient => (ingredient.inPantry ? t('alreadyIn') : null)}
    />
  )
}
