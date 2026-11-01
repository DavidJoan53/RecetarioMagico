import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {RecipeCard} from '@/components/recipe-card'
import {latestRecipes} from '@/db/queries/recipes'
import {getSession} from '@/lib/session'

/** Keyset pages of ten; uuid v7 ordering means no OFFSET drift. */
const PAGE_SIZE = 10

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [t, recipes] = await Promise.all([
    getTranslations(),
    latestRecipes(PAGE_SIZE),
  ])

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          {t('nav.recipes')}
        </h1>
        <Link
          href="/recipes/new"
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white"
        >
          + {t('recipes.newRecipe')}
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
          {t('recipes.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              imageUrl={recipe.imageUrl}
              prepTimeMinutes={recipe.prepTimeMinutes}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
