import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {DeletionAnnouncer} from '@/components/deletion-announcer'
import {pantryItems} from '@/db/pantry/queries'
import {PantryRow} from './pantry-row'

export async function PantryList() {
  const t = await getTranslations('pantry')
  const items = await pantryItems()

  if (items.length === 0) {
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

  return (
    <DeletionAnnouncer>
      <ul aria-label={t('title')} className="flex flex-col gap-2">
        {items.map(item => (
          <PantryRow key={item.ingredientId} item={item} />
        ))}
      </ul>
    </DeletionAnnouncer>
  )
}
