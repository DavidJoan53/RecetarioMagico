import {getTranslations} from 'next-intl/server'
import {EmptyState} from '@/components/empty-state'
import {PageHeader} from '@/components/page-header'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      <EmptyState title={t('empty')} hint={t('emptyHint')} />
    </main>
  )
}
