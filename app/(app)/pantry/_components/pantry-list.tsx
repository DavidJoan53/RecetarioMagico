import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {pantryPage} from '@/db/pantry/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import {PantryPages} from './pantry-pages'

export async function PantryList() {
  const t = await getTranslations('pantry')
  const page = await pantryPage({after: null, limit: PAGE_SIZE})

  if (page.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-light border-dashed p-6 text-center">
        <p className="text-secondary-foreground text-sm">{t('empty')}</p>
        {/* Filled from the picker, so point there rather than describing it. */}
        <Link
          href="/pantry/add"
          className="font-semibold text-primary-strong text-sm"
        >
          {t('addMore')} →
        </Link>
      </div>
    )
  }

  return <PantryPages initialPage={page} />
}
