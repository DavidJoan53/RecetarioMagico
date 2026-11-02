import Link from 'next/link'
import {useTranslations} from 'next-intl'
import {EmptyState} from './empty-state'

type Props = {
  title: string
  seeAllHref: string
  isEmpty: boolean
  emptyText: string
  /** What to do about it, when there is something to say. */
  emptyHint?: string
  children: React.ReactNode
}

export function Section({
  title,
  seeAllHref,
  isEmpty,
  emptyText,
  emptyHint,
  children,
}: Props) {
  const t = useTranslations('home')

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold text-secondary-foreground text-xs uppercase tracking-wider">
        {title}
      </h2>

      {isEmpty ? (
        <EmptyState title={emptyText} hint={emptyHint} />
      ) : (
        <>
          <ul className="flex flex-col gap-2">{children}</ul>
          <Link
            href={seeAllHref}
            className="text-center font-semibold text-primary-strong text-sm"
          >
            {t('seeAll')} →
          </Link>
        </>
      )}
    </section>
  )
}
