import {getTranslations} from 'next-intl/server'
import {DeletionAnnouncer} from '@/components/deletion-announcer'
import {allIngredients} from '@/db/ingredients/queries'
import {IngredientRow} from './ingredient-row'

export async function IngredientList() {
  const t = await getTranslations('ingredients')
  const list = await allIngredients()

  if (list.length === 0) {
    return (
      <p className="rounded-lg border border-light border-dashed p-6 text-center text-secondary-foreground text-sm">
        {t('empty')}
      </p>
    )
  }

  return (
    <DeletionAnnouncer>
      <ul aria-label={t('listLabel')} className="flex flex-col gap-2">
        {list.map(ingredient => (
          <IngredientRow key={ingredient.id} ingredient={ingredient} />
        ))}
      </ul>
    </DeletionAnnouncer>
  )
}
