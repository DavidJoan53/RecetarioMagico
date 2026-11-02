import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {EmptyState} from '@/components/empty-state'
import {recipesPage} from '@/db/recipes/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {RecipePages} from './recipe-pages'

export async function RecipeList() {
  const t = await getTranslations('recipes')
  const page = await recipesPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <EmptyState
        title={t('empty')}
        hint={t('emptyHint')}
        action={
          <Link
            href="/recipes/new"
            className="font-semibold text-primary-strong text-sm"
          >
            {t('newRecipe')} →
          </Link>
        }
      />
    )
  }

  /* The first page is rendered here and handed over; the rest are fetched
     as they are reached, so nothing waits on recipes nobody has scrolled to. */
  return <RecipePages initialPage={page} />
}
