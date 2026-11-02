import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {EmptyState} from '@/components/empty-state'
import {pantryPage} from '@/db/pantry/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {PantryPages} from './pantry-pages'

export async function PantryList() {
  const t = await getTranslations('pantry')
  const page = await pantryPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <EmptyState
        title={t('empty')}
        hint={t('emptyHint')}
        action={
          /* Filled from the picker, so point there rather than describing it. */
          <Link
            href="/pantry/add"
            className="font-semibold text-primary-strong text-sm"
          >
            {t('addMore')} →
          </Link>
        }
      />
    )
  }

  return <PantryPages initialPage={page} />
}
