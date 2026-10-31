import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {RecipeCard} from '@/components/recipe-card'
import {Section} from '@/components/section'
import {latestDinners} from '@/db/queries/dinners'
import {latestRecipes} from '@/db/queries/recipes'
import {getSession} from '@/lib/session'

/** Five per section, each with one way through to the full list. */
const PREVIEW_COUNT = 5

/** Reads the database per request; prerendering would freeze the data. */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Checked here rather than trusted from the proxy. See lib/session.
  const [t, session, dinners, recipes] = await Promise.all([
    getTranslations(),
    getSession(),
    latestDinners(PREVIEW_COUNT),
    latestRecipes(PREVIEW_COUNT),
  ])

  if (!session) redirect('/')

  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl tracking-tight">{t('nav.home')}</h1>

      <Section
        title={t('home.latestDinners')}
        seeAllHref="/dinners"
        isEmpty={dinners.length === 0}
        emptyText={t('home.noDinners')}
      >
        {dinners.flatMap(dinner =>
          dinner.recipes.map(recipe => (
            <RecipeCard
              key={`${dinner.id}-${recipe.id}`}
              id={recipe.id}
              name={recipe.name}
              imageUrl={recipe.imageUrl}
            />
          )),
        )}
      </Section>

      <Section
        title={t('home.newRecipes')}
        seeAllHref="/recipes"
        isEmpty={recipes.length === 0}
        emptyText={t('home.noRecipes')}
      >
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            name={recipe.name}
            imageUrl={recipe.imageUrl}
            prepTimeMinutes={recipe.prepTimeMinutes}
          />
        ))}
      </Section>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/labels"
          className="rounded-lg border border-light bg-background-foreground p-3 font-semibold text-sm"
        >
          {t('nav.labels')}
        </Link>
        <Link
          href="/ingredients"
          className="rounded-lg border border-light bg-background-foreground p-3 font-semibold text-sm"
        >
          {t('nav.ingredients')}
        </Link>
      </div>
    </main>
  )
}
