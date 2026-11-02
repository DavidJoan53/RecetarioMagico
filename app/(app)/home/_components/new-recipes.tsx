import {getTranslations} from 'next-intl/server'
import {RecipeCard} from '@/components/recipe-card'
import {Section} from '@/components/section'
import {latestRecipes} from '@/db/recipes/queries'

export async function NewRecipes({limit}: {limit: number}) {
  const t = await getTranslations('home')
  const recipes = await latestRecipes(limit)

  return (
    <Section
      title={t('newRecipes')}
      seeAllHref="/recipes"
      isEmpty={recipes.length === 0}
      emptyText={t('noRecipes')}
      emptyHint={t('noRecipesHint')}
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
  )
}
