'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useTranslations} from 'next-intl'

const TABS = [
  {href: '/home', key: 'home'},
  {href: '/recipes', key: 'recipes'},
  {href: '/dinners', key: 'dinners'},
  {href: '/settings', key: 'settings'},
] as const

export function TabBar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('home')}
      className="sticky bottom-0 flex border-light border-t bg-background"
    >
      {TABS.map(tab => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'flex-1 border-primary-strong border-t-2 py-3 text-center font-bold text-primary-strong text-xs'
                : 'flex-1 py-3 text-center text-secondary-foreground text-xs'
            }
          >
            {t(tab.key)}
          </Link>
        )
      })}
    </nav>
  )
}
