import {Plus} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {PageHeader} from '@/components/page-header'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {RecipeList} from './_components/recipe-list'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title={t('nav.recipes')}
        actions={
          /* Icon only, so the name has to be carried by the label. size-11
             is the 44px target; the glyph inside it is smaller. */
          <Link
            href="/recipes/new"
            aria-label={t('recipes.newRecipe')}
            className="flex size-11 items-center justify-center rounded-lg bg-primary-strong text-white"
          >
            <Plus aria-hidden="true" size={20} />
          </Link>
        }
      />

      <Suspense fallback={<SectionSkeleton />}>
        <RecipeList />
      </Suspense>
    </main>
  )
}
