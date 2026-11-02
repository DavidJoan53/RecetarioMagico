import {getTranslations} from 'next-intl/server'
import {dinnersPage} from '@/db/dinners/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {DinnerPages} from './dinner-pages'

export async function DinnerList() {
  const t = await getTranslations('dinners')
  const page = await dinnersPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  /* The first page is rendered here and handed over; the rest are fetched as
     they are reached, so nothing waits on dinners nobody has scrolled to. */
  return <DinnerPages initialPage={page} />
}
