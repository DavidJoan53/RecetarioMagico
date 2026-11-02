import {ChevronRight} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {LatestDinners} from './_components/latest-dinners'
import {NewRecipes} from './_components/new-recipes'

const MANAGEMENT = [
  {href: '/labels', key: 'labels'},
  {href: '/ingredients', key: 'ingredients'},
  {href: '/pantry', key: 'pantry'},
] as const

/** Five per section, each with one way through to the full list. */
const PREVIEW_COUNT = 5

/** Reads the database per request; prerendering would freeze the data. */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Checked here rather than trusted from the proxy. See lib/session.
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('nav')

  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl tracking-tight">{t('home')}</h1>

      {/* Each section fetches its own data, so neither waits on the other
          and a slow query streams in rather than blocking the page. */}
      <Suspense fallback={<SectionSkeleton />}>
        <LatestDinners limit={PREVIEW_COUNT} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <NewRecipes limit={PREVIEW_COUNT} />
      </Suspense>

      {/* The pages the tab bar has no room for. Full width and stacked: three
          in a two-column grid left the last one half a row on its own. */}
      <nav aria-label={t('manage')} className="flex flex-col gap-2">
        {MANAGEMENT.map(({href, key}) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-2 rounded-lg border border-light bg-background-foreground p-4 font-semibold text-sm"
          >
            {t(key)}
            <ChevronRight aria-hidden="true" size={18} />
          </Link>
        ))}
      </nav>
    </main>
  )
}
