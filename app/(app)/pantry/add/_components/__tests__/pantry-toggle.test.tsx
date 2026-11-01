import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {PantryToggle} from '../pantry-toggle'

const toggle = vi.fn()
vi.mock('../../../actions', () => ({
  togglePantryAction: (...a: unknown[]) => toggle(...a),
}))

const setup = (inPantry: boolean) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PantryToggle ingredientId="i1" name="Tomate" inPantry={inPantry} />
    </NextIntlClientProvider>,
  )

beforeEach(() => {
  toggle.mockReset()
  toggle.mockResolvedValue({})
})

describe('PantryToggle', () => {
  /** aria-pressed carries the state a checkbox's tick would have. */
  it('reports whether it is on', () => {
    setup(true)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('reports when it is off', () => {
    setup(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  /**
   * The name must contain the visible words, or a speech-input user saying
   * what they can read cannot press it. WCAG 2.5.3 — an aria-label replacing
   * "La tengo" is exactly the failure.
   */
  it('keeps the words that are on it in its name', () => {
    setup(true)
    expect(screen.getByRole('button', {name: /La tengo/})).toBeInTheDocument()
  })

  /** And still says which row it belongs to, for a list of identical ones. */
  it('adds the ingredient to tell the rows apart', () => {
    setup(false)
    expect(
      screen.getByRole('button', {name: 'No la tengo Tomate'}),
    ).toBeInTheDocument()
  })

  /**
   * The next state is sent, not read. Two quick clicks would otherwise both
   * read "not in the pantry" and both decide to add.
   */
  it('sends the current state so the server does not have to guess', async () => {
    setup(true)
    await userEvent.click(screen.getByRole('button'))
    const form = toggle.mock.calls[0]?.[1] as FormData
    expect(form.get('id')).toBe('i1')
    expect(form.get('inPantry')).toBe('true')
  })

  /**
   * Colour alone does not carry the state: it is invisible to anyone who
   * cannot separate the two fills, and hard to scan for everyone else.
   */
  it('draws the state as well as colouring it', () => {
    setup(true)
    expect(screen.getByRole('button')).toHaveTextContent('✓')
  })

  /** Decoration must not reach what is announced. */
  it('keeps the tick out of the name', () => {
    setup(true)
    expect(
      screen.getByRole('button', {name: 'La tengo Tomate'}),
    ).toBeInTheDocument()
  })

  it('shows an empty box when it is not had', () => {
    setup(false)
    expect(screen.getByRole('button')).not.toHaveTextContent('✓')
  })
})
