import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {PageHeader} from '@/components/page-header'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {IngredientForm} from './_components/ingredient-form'
import {IngredientList} from './_components/ingredient-list'
import {createIngredientAction} from './actions'

export const dynamic = 'force-dynamic'

export default async function IngredientsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={t('nav.ingredients')} />

      <IngredientForm action={createIngredientAction} />

      <Suspense fallback={<SectionSkeleton />}>
        <IngredientList />
      </Suspense>
    </main>
  )
}
