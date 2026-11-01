import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {RecipeList} from './_components/recipe-list'

/** Keyset pages of ten; uuid v7 ordering means no OFFSET drift. */
const PAGE_SIZE = 10

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          {t('nav.recipes')}
        </h1>
        <Link
          href="/recipes/new"
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white"
        >
          + {t('recipes.newRecipe')}
        </Link>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <RecipeList limit={PAGE_SIZE} />
      </Suspense>
    </main>
  )
}
