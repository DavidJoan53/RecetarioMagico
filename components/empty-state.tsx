type Props = {
  /** What is empty, said in terms of the thing rather than the screen. */
  title: string
  /** What to do about it. Names the control, never where it sits. */
  hint?: string
  /** The way out, where there is somewhere to go. */
  action?: React.ReactNode
}

/**
 * A list with nothing in it yet.
 *
 * One shape everywhere, because an empty list is the first thing a new user
 * sees on most of these pages and a bare grey sentence tells them neither
 * what is missing nor what to do.
 */
export function EmptyState({title, hint, action}: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-light border-dashed p-6 text-center">
      <p className="font-semibold text-sm">{title}</p>
      {hint && <p className="text-secondary-foreground text-sm">{hint}</p>}
      {action}
    </div>
  )
}
