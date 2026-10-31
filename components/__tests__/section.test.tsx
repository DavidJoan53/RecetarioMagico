import {render, screen} from '@testing-library/react'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it} from 'vitest'
import messages from '@/messages/es.json'
import {Section} from '../section'

const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  )

describe('Section', () => {
  it('shows the heading and its items when there are some', () => {
    wrap(
      <Section
        title="Últimas cenas"
        seeAllHref="/dinners"
        isEmpty={false}
        emptyText="vacío"
      >
        <li>Arepa</li>
      </Section>,
    )
    expect(
      screen.getByRole('heading', {name: 'Últimas cenas'}),
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Arepa')
  })

  it('offers a way through to the full list', () => {
    wrap(
      <Section
        title="T"
        seeAllHref="/recipes"
        isEmpty={false}
        emptyText="vacío"
      >
        <li>x</li>
      </Section>,
    )
    expect(
      screen.getByRole('link', {name: new RegExp(messages.home.seeAll)}),
    ).toHaveAttribute('href', '/recipes')
  })

  /** An empty section has nowhere to go, so the link would be a dead end. */
  it('shows the empty message and hides the list and link', () => {
    wrap(
      <Section
        title="T"
        seeAllHref="/recipes"
        isEmpty={true}
        emptyText="Todavía no tienes recetas."
      >
        <li>should not render</li>
      </Section>,
    )
    expect(screen.getByText('Todavía no tienes recetas.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('keeps the heading visible when empty, so the section is still named', () => {
    wrap(
      <Section
        title="Últimas cenas"
        seeAllHref="/d"
        isEmpty={true}
        emptyText="v"
      >
        <li>x</li>
      </Section>,
    )
    expect(
      screen.getByRole('heading', {name: 'Últimas cenas'}),
    ).toBeInTheDocument()
  })
})
