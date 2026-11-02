import {Plus} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {PageHeader} from '@/components/page-header'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {PantryList} from './_components/pantry-list'

export const dynamic = 'force-dynamic'

export default async function PantryPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title={t('nav.pantry')}
        actions={
          <Link
            href="/pantry/add"
            aria-label={t('pantry.addMore')}
            className="flex size-11 items-center justify-center rounded-lg bg-primary-strong text-white"
          >
            <Plus aria-hidden="true" size={20} />
          </Link>
        }
      />

      <Suspense fallback={<SectionSkeleton />}>
        <PantryList />
      </Suspense>
    </main>
  )
}
