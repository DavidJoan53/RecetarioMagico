import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'
import {PageHeader} from '@/components/page-header'
import {RecipeForm} from '@/components/recipe-form'
import {getSession} from '@/lib/session'
import {createRecipeAction} from '../actions'

export default async function NewRecipePage() {
  const session = await getSession()
  if (!session) redirect('/')

  const t = await getTranslations('recipeForm')
  const nav = await getTranslations('recipe')

  return (
    <main className="flex flex-col gap-5">
      <PageHeader
        title={t('newTitle')}
        leading={
          /* The way out of the form. Named after where it goes, because that
             is what it does — nothing here is saved on the way. */
          <Link
            href="/recipes"
            aria-label={nav('backToRecipes')}
            className="flex size-11 items-center justify-center rounded-lg"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
        }
      />
      <RecipeForm action={createRecipeAction} submitLabel={t('create')} />
    </main>
  )
}
