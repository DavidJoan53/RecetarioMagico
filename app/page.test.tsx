import {render, screen} from '@testing-library/react'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it} from 'vitest'
import messages from '@/messages/es.json'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the app name as the page heading', () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <HomePage />
      </NextIntlClientProvider>,
    )
    // Queried by role and name rather than by text or test id: this asserts
    // the heading is reachable to assistive tech, not just that the string
    // exists somewhere in the DOM.
    expect(
      screen.getByRole('heading', {level: 1, name: 'Recetario Mágico'}),
    ).toBeInTheDocument()
  })
})
