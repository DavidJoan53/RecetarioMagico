import {getTranslations} from 'next-intl/server'
import {EmptyState} from '@/components/empty-state'
import {searchIngredients} from '@/db/ingredients/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {IngredientPages} from './ingredient-pages'

export async function IngredientList() {
  const t = await getTranslations('ingredients')
  /* The unfiltered search: the same query the picker pages through, so one
     fix to the ordering or the cursor lands on both. */
  const page = await searchIngredients({
    query: '',
    after: null,
    limit: PAGE_SIZE,
  })

  if (page.items.length === 0) {
    return <EmptyState title={t('empty')} hint={t('emptyHint')} />
  }

  return <IngredientPages initialPage={page} />
}
