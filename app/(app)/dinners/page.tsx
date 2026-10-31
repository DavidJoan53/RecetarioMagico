import {getTranslations} from 'next-intl/server'

export default async function DinnersPage() {
  const t = await getTranslations()
  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl tracking-tight">{t('nav.dinners')}</h1>
      <p className="text-secondary-foreground text-sm">{t('common.empty')}</p>
    </main>
  )
}
