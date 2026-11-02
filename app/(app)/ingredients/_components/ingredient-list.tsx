import {getTranslations} from 'next-intl/server'
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
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  return <IngredientPages initialPage={page} />
}
