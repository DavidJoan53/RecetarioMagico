import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {EmptyState} from '@/components/empty-state'
import {dinnersPage} from '@/db/dinners/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {DinnerPages} from './dinner-pages'

export async function DinnerList() {
  const t = await getTranslations('dinners')
  const page = await dinnersPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <EmptyState
        title={t('empty')}
        hint={t('emptyHint')}
        action={
          <Link
            href="/dinners/new"
            className="font-semibold text-primary-strong text-sm"
          >
            {t('addMore')} →
          </Link>
        }
      />
    )
  }

  /* The first page is rendered here and handed over; the rest are fetched as
     they are reached, so nothing waits on dinners nobody has scrolled to. */
  return <DinnerPages initialPage={page} />
}
