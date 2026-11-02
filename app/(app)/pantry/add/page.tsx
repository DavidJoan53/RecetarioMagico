import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {PageHeader} from '@/components/page-header'
import {getSession} from '@/lib/session'
import {AddToPantryForm} from './_components/add-to-pantry-form'

export const dynamic = 'force-dynamic'

export default async function AddToPantryPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('pantry')

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title={t('addTitle')}
        leading={
          <Link
            href="/pantry"
            aria-label={t('backToPantry')}
            className="flex size-11 items-center justify-center rounded-lg"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
        }
      />

      <p className="text-secondary-foreground text-sm">{t('addHint')}</p>

      <AddToPantryForm />
    </main>
  )
}
