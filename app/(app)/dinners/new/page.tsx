import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {PageHeader} from '@/components/page-header'
import {getSession} from '@/lib/session'
import {createDinnerAction} from '../actions'
import {DinnerForm} from './_components/dinner-form'

export const dynamic = 'force-dynamic'

export default async function NewDinnerPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('dinners')

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title={t('addTitle')}
        leading={
          <Link
            href="/dinners"
            aria-label={t('backToDinners')}
            className="flex size-8 items-center justify-center rounded-lg"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
        }
      />

      <p className="text-secondary-foreground text-sm">{t('addHint')}</p>

      <DinnerForm action={createDinnerAction} />
    </main>
  )
}
