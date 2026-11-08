import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {AddGroup} from './_components/add-group'
import {GroupList} from './_components/group-list'

export const dynamic = 'force-dynamic'

export default async function LabelsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <AddGroup title={t('nav.labels')} />

      <Suspense fallback={<SectionSkeleton />}>
        <GroupList />
      </Suspense>
    </main>
  )
}
