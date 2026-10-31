import {render, screen} from '@testing-library/react'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'

const pathname = vi.hoisted(() => ({current: '/home'}))
vi.mock('next/navigation', () => ({usePathname: () => pathname.current}))

const {TabBar} = await import('../tab-bar')

const wrap = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <TabBar />
    </NextIntlClientProvider>,
  )

describe('TabBar', () => {
  it('offers every destination as a link', () => {
    pathname.current = '/home'
    wrap()
    for (const [label, href] of [
      [messages.nav.home, '/home'],
      [messages.nav.recipes, '/recipes'],
      [messages.nav.dinners, '/dinners'],
      [messages.nav.settings, '/settings'],
    ]) {
      expect(screen.getByRole('link', {name: label})).toHaveAttribute(
        'href',
        href,
      )
    }
  })

  /** aria-current is what tells a screen reader which tab you are on. */
  it('marks exactly one tab as current', () => {
    pathname.current = '/recipes'
    wrap()
    const current = screen
      .getAllByRole('link')
      .filter(l => l.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent(messages.nav.recipes)
  })

  it('treats a nested route as being on its tab', () => {
    pathname.current = '/recipes/abc123'
    wrap()
    expect(
      screen.getByRole('link', {name: messages.nav.recipes}),
    ).toHaveAttribute('aria-current', 'page')
  })
})
