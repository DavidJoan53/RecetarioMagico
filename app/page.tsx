import {useTranslations} from 'next-intl'

export default function HomePage() {
  const t = useTranslations('tabs')
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="font-bold text-3xl">Recetario Mágico</h1>
      <p className="mt-2 text-secondary-foreground">
        Migración a Next.js en curso — {t('home')}.
      </p>
    </main>
  )
}
