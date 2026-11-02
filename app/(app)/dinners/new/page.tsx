import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
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
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">{t('addTitle')}</h1>
        <p className="text-secondary-foreground text-sm">{t('addHint')}</p>
      </div>

      {/* Stays put rather than returning to the list: a week is logged
          several at a time, and the list is one tap away. */}
      <DinnerForm action={createDinnerAction} />

      <Link
        href="/dinners"
        className="text-center font-semibold text-primary-strong text-sm"
      >
        ← {t('backToDinners')}
      </Link>
    </main>
  )
}
