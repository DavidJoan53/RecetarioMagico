import {getTranslations} from 'next-intl/server'
import {RecipeCard} from '@/components/recipe-card'
import {latestRecipes} from '@/db/queries/recipes'

export async function RecipeList({limit}: {limit: number}) {
  const t = await getTranslations('recipes')
  const recipes = await latestRecipes(limit)

  if (recipes.length === 0) {
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  return (
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
  )
}
