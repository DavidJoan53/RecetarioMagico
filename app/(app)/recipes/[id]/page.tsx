import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import {getLocale, getTranslations} from 'next-intl/server'
import {recipeById} from '@/db/recipes/queries'
import {formatAmount} from '@/lib/amounts'
import {getSession} from '@/lib/session'
import {recipeIdFrom} from '@/lib/validation/recipe'
import {THUMBNAIL_SIZE} from '@/lib/youtube'

export const dynamic = 'force-dynamic'

export default async function RecipePage({
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

  const t = await getTranslations('recipe')
  const locale = await getLocale()

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl tracking-tight">{recipe.name}</h1>
          <p className="text-secondary-foreground text-sm">
            {recipe.prepTimeMinutes
              ? t('minutes', {count: recipe.prepTimeMinutes})
              : t('noTime')}
          </p>
        </div>
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="rounded-lg bg-primary-strong px-3 py-2 font-semibold text-sm text-white"
        >
          {t('edit')}
        </Link>
      </div>

      {recipe.imageUrl && (
        // Straight from YouTube at its native size, so Vercel's image
        // optimiser is never involved. A still, never an iframe: the player
        // is about a megabyte of JavaScript.
        <img
          src={recipe.imageUrl}
          alt=""
          width={THUMBNAIL_SIZE.width}
          height={THUMBNAIL_SIZE.height}
          className="w-full max-w-sm rounded-lg object-cover"
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">{t('ingredients')}</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-secondary-foreground text-sm">
            {t('noIngredients')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recipe.ingredients.map(item => (
              <li
                key={item.ingredientId}
                className="flex justify-between gap-3 border-light border-b py-1 text-sm"
              >
                <span>{item.name}</span>
                <span className="text-secondary-foreground">
                  {formatAmount(item, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recipe.instructions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg">{t('instructions')}</h2>
          {/* Ordered, because the steps are a sequence and the numbers are
              the content rather than decoration. */}
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            {recipe.instructions.map((step, index) => (
              // Steps have no id and may legitimately repeat, so the index
              // is the only stable key. They are never reordered in place.
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {recipe.links.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg">{t('links')}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {recipe.links.map(link => (
              <li key={link}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary-strong underline"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/recipes"
        className="self-start font-semibold text-primary-strong text-sm"
      >
        {t('backToRecipes')}
      </Link>
    </main>
  )
}
