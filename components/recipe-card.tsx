import Link from 'next/link'
import {useLocale, useTranslations} from 'next-intl'
import type {RecipeIngredient} from '@/db/recipes/queries'
import {formatIngredientLine} from '@/lib/amounts'
import {THUMBNAIL_SIZE} from '@/lib/youtube'
import {RecipeCardFallback} from './recipe-card-fallback'

type Props = {
  id: string
  name: string
  imageUrl: string | null
  prepTimeMinutes?: number | null
  /** Omitted where there is no room for them — the home strip. */
  ingredients?: RecipeIngredient[]
}

export function RecipeCard({
  id,
  name,
  imageUrl,
  prepTimeMinutes,
  ingredients,
}: Props) {
  const t = useTranslations('recipe')
  const locale = useLocale()

  return (
    <li>
      <Link
        href={`/recipes/${id}`}
        className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-2"
      >
        {imageUrl ? (
          // Served straight from YouTube at its native size, so Vercel's
          // image optimiser is never involved.
          <img
            src={imageUrl}
            alt=""
            width={THUMBNAIL_SIZE.width}
            height={THUMBNAIL_SIZE.height}
            loading="lazy"
            className="h-12 w-20 flex-none rounded object-cover"
          />
        ) : (
          <RecipeCardFallback name={name} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-sm">{name}</span>
          {/* The space is load-bearing. Two block spans put no text node
              between them, so the link is read as "Arepa25 min". */}{' '}
          <span className="block text-secondary-foreground text-xs">
            {prepTimeMinutes
              ? t('minutes', {count: prepTimeMinutes})
              : t('noTime')}
          </span>
        </span>
      </Link>

      {/* Beside the link, not inside it. Everything within a link becomes its
          accessible name, and a list of links each reading "Arepa 25 min
          Tomate 200 g · Cebolla 1 unidad" is a wall of text to tab through. */}
      {ingredients && ingredients.length > 0 && (
        <p className="truncate px-2 pt-1 text-secondary-foreground text-xs">
          <span className="sr-only">{t('ingredients')}: </span>
          {formatIngredientLine(ingredients, locale)}
        </p>
      )}
    </li>
  )
}
