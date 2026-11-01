import {getTranslations} from 'next-intl/server'
import {RecipeCard} from '@/components/recipe-card'
import {Section} from '@/components/section'
import {latestDinners} from '@/db/queries/dinners/latest-dinners'

export async function LatestDinners({limit}: {limit: number}) {
  const t = await getTranslations('home')
  const dinners = await latestDinners(limit)

  return (
    <Section
      title={t('latestDinners')}
      seeAllHref="/dinners"
      isEmpty={dinners.length === 0}
      emptyText={t('noDinners')}
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
  )
}
