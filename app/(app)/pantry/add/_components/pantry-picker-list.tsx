import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {allIngredientsWithPantry} from '@/db/ingredients/queries'
import {PantryToggle} from './pantry-toggle'

export async function PantryPickerList() {
  const t = await getTranslations('pantry')
  const list = await allIngredientsWithPantry()

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-light border-dashed p-6 text-center">
        <p className="text-secondary-foreground text-sm">
          {t('noIngredients')}
        </p>
        <Link
          href="/ingredients"
          className="font-semibold text-primary-strong text-sm"
        >
          {t('goToIngredients')} →
        </Link>
      </div>
    )
  }

  return (
    <ul aria-label={t('addTitle')} className="flex flex-col gap-2">
      {list.map(ingredient => (
        <li
          key={ingredient.id}
          className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-2"
        >
          <span className="min-w-0 flex-1 truncate font-semibold text-sm">
            {ingredient.name}
          </span>
          <PantryToggle
            ingredientId={ingredient.id}
            name={ingredient.name}
            inPantry={ingredient.inPantry}
          />
        </li>
      ))}
    </ul>
  )
}
