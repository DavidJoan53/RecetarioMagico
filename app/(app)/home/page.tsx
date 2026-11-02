import {Carrot, ChevronRight, Refrigerator, Tag} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'
import {SectionSkeleton} from '@/components/section-skeleton'
import {getSession} from '@/lib/session'
import {LatestDinners} from './_components/latest-dinners'
import {NewRecipes} from './_components/new-recipes'

/** The icon belongs to the row, not to the page it leads to. */
const MANAGEMENT = [
  {href: '/labels', key: 'labels', Icon: Tag},
  {href: '/ingredients', key: 'ingredients', Icon: Carrot},
  {href: '/pantry', key: 'pantry', Icon: Refrigerator},
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
        {MANAGEMENT.map(({href, key, Icon}) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-4 font-semibold text-sm"
          >
            {/* Decoration: the link is already named by its own text, and a
                carrot read out before "Ingredientes" says it twice. */}
            <Icon aria-hidden="true" size={18} className="shrink-0" />
            <span className="flex-1">{t(key)}</span>
            <ChevronRight aria-hidden="true" size={16} className="shrink-0" />
          </Link>
        ))}
      </nav>
    </main>
  )
}
