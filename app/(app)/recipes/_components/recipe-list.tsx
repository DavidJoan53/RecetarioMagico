import {getTranslations} from 'next-intl/server'
import {recipesPage} from '@/db/recipes/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {RecipePages} from './recipe-pages'

export async function RecipeList() {
  const t = await getTranslations('recipes')
  const page = await recipesPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  /* The first page is rendered here and handed over; the rest are fetched
     as they are reached, so nothing waits on recipes nobody has scrolled to. */
  return <RecipePages initialPage={page} />
}
