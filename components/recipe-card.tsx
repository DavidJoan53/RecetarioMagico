import Link from 'next/link'
import {useTranslations} from 'next-intl'
import {THUMBNAIL_SIZE} from '@/lib/youtube'
import {RecipeCardFallback} from './recipe-card-fallback'

type Props = {
  id: string
  name: string
  imageUrl: string | null
  prepTimeMinutes?: number | null
}

export function RecipeCard({id, name, imageUrl, prepTimeMinutes}: Props) {
  const t = useTranslations('recipe')

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
          <span className="block text-secondary-foreground text-xs">
            {prepTimeMinutes
              ? t('minutes', {count: prepTimeMinutes})
              : t('noTime')}
          </span>
        </span>
      </Link>
    </li>
  )
}
