import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {PantryPickerList} from './_components/pantry-picker-list'

export const dynamic = 'force-dynamic'

export default async function AddToPantryPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('pantry')

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">{t('addTitle')}</h1>
        <p className="text-secondary-foreground text-sm">{t('addHint')}</p>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <PantryPickerList />
      </Suspense>

      <Link
        href="/pantry"
        className="text-center font-semibold text-primary-strong text-sm"
      >
        ← {t('backToPantry')}
      </Link>
    </main>
  )
}
