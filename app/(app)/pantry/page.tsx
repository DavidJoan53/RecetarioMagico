import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-bold text-2xl tracking-tight">{t('nav.pantry')}</h1>
        <Link
          href="/pantry/add"
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white"
        >
          + {t('pantry.addMore')}
        </Link>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <PantryList />
      </Suspense>
    </main>
  )
}
