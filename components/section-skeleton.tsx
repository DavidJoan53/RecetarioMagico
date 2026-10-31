/** Reserves the section's height so streaming in cannot shift the page. */
export function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-3 w-28 rounded bg-light" />
      {[0, 1].map(i => (
        <div
          key={i}
          className="h-16 rounded-lg border border-light bg-background-foreground"
        />
      ))}
    </div>
  )
}
