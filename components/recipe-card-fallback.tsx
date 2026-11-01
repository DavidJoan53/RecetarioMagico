/** Letter tile when there is no thumbnail — never an Open Graph scrape. */
export function RecipeCardFallback({name}: {name: string}) {
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-20 flex-none items-center justify-center rounded bg-light font-bold text-secondary-foreground"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}
