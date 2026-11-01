import type {Ingredient} from '@/db/schema'

type Props = {
  ingredient: Ingredient
  /** Trailing slot — the pantry control lands here. */
  children?: React.ReactNode
}

export function IngredientRow({ingredient, children}: Props) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-light bg-background-foreground p-2">
      {ingredient.photoUrl ? (
        /* Not next/image: the host is whatever the user pasted, and
           remotePatterns only allows the YouTube thumbnail domain. */
        <img
          src={ingredient.photoUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="size-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span aria-hidden className="size-10 shrink-0 rounded-md bg-light" />
      )}

      <span className="min-w-0 flex-1 truncate font-semibold text-sm">
        {ingredient.name}
      </span>

      {children}
    </li>
  )
}
