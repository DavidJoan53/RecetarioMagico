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
  /**
   * Already translated. One per row where there are several, so the pickers
   * are told apart by name rather than all reading "Ingrediente".
   */
  label?: string
  /** The name to start on, when an existing choice is being edited. */
  initialLabel?: string
  /**
   * Chosen already somewhere else in the same form. Marked rather than
   * removed, for the reason the pantry's note exists: a missing option makes
   * "no such ingredient" and "you already picked that one" look alike.
   */
  usedIds?: readonly string[]
  /** Already translated, because what counts as "used" is the caller's. */
  usedNote?: string
}

export async function fetchIngredientPage(query: string, after: string | null) {
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
export function IngredientCombobox({
  value,
  onChange,
  label,
  initialLabel,
  usedIds,
  usedNote,
}: Props) {
  const t = useTranslations('pantry')

  return (
    <Combobox
      label={label ?? t('ingredient')}
      placeholder={t('searchPlaceholder')}
      emptyMessage={t('noMatches')}
      value={value}
      onChange={onChange}
      initialLabel={initialLabel}
      queryKey={queryKeys.ingredients}
      fetchPage={fetchIngredientPage}
      getKey={ingredient => ingredient.id}
      getLabel={ingredient => ingredient.name}
      renderNote={ingredient => {
        /* Being in the form already is the more pressing of the two: it is
           the one that stops the choice from being usable. */
        if (usedNote && usedIds?.includes(ingredient.id)) return usedNote
        return ingredient.inPantry ? t('alreadyIn') : null
      }}
    />
  )
}
