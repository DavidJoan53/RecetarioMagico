import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {PageHeader} from '@/components/page-header'
import {RecipeForm} from '@/components/recipe-form'
import {recipeById} from '@/db/recipes/queries'
import {getSession} from '@/lib/session'
import {recipeIdFrom} from '@/lib/validation/recipe'
import {updateRecipeAction} from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{id: string}>
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const {id} = await params
  const parsed = recipeIdFrom(id)
  if (!parsed.success) notFound()

  const recipe = await recipeById(parsed.data)
  if (!recipe) notFound()

  const t = await getTranslations('recipeForm')

  return (
    <main className="flex flex-col gap-5">
      <PageHeader
        title={t('editTitle', {name: recipe.name})}
        leading={
          <Link
            href={`/recipes/${recipe.id}`}
            aria-label={t('backToRecipe')}
            className="flex size-8 items-center justify-center rounded-lg"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
        }
      />
      <RecipeForm
        action={updateRecipeAction}
        submitLabel={t('save')}
        recipe={recipe}
      />
    </main>
  )
}
