type Props = {
  title: string
  /** Sits left of the title. A way back, on the pages that have one. */
  leading?: React.ReactNode
  /** Sits right of the title. What this page can do. */
  actions?: React.ReactNode
}

/**
 * The top of a page: a centred title with its controls either side, ruled off
 * from the content below.
 *
 * The two sides are both flex-1 so they take the same width whatever is in
 * them, which is what leaves the title centred on the page rather than
 * centred in the gap between them.
 */
export function PageHeader({title, leading, actions}: Props) {
  return (
    <header className="flex items-center gap-2 border-light border-b pb-3">
      <div className="flex flex-1 justify-start">{leading}</div>

      {/* First heading on the page, and the only h1. */}
      <h1 className="min-w-0 truncate text-center font-bold text-xl tracking-tight">
        {title}
      </h1>

      <div className="flex flex-1 justify-end">{actions}</div>
    </header>
  )
}
