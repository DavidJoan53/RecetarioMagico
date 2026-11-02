import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {PageHeader} from '@/components/page-header'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {GroupList} from './_components/group-list'
import {NewGroupForm} from './_components/new-group-form'

export const dynamic = 'force-dynamic'

export default async function LabelsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations()

  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={t('nav.labels')} />

      {/* Before the groups: a label cannot exist without one, so this is
          the only thing to do on an empty page. */}
      <NewGroupForm />

      <Suspense fallback={<SectionSkeleton />}>
        <GroupList />
      </Suspense>
    </main>
  )
}
