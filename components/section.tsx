import Link from 'next/link'
import {useTranslations} from 'next-intl'

type Props = {
  title: string
  seeAllHref: string
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}

export function Section({
  title,
  seeAllHref,
  isEmpty,
  emptyText,
  children,
}: Props) {
  const t = useTranslations('home')

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-mono text-secondary-foreground text-xs uppercase tracking-wider">
        {title}
      </h2>

      {isEmpty ? (
        <p className="rounded-lg border border-light border-dashed p-4 text-center text-secondary-foreground text-sm">
          {emptyText}
        </p>
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
