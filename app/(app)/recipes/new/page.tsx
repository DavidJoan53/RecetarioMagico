import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {RecipeForm} from '@/components/recipe-form'
import {getSession} from '@/lib/session'
import {createRecipeAction} from '../actions'

export default async function NewRecipePage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('recipeForm')

  return (
    <main className="flex flex-col gap-5">
      <h1 className="font-bold text-2xl tracking-tight">{t('newTitle')}</h1>
      <RecipeForm action={createRecipeAction} submitLabel={t('create')} />
    </main>
  )
}
