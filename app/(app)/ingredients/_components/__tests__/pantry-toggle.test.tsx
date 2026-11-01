import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {PantryToggle} from '../pantry-toggle'

const toggle = vi.fn()
vi.mock('../../actions', () => ({
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

  /** A row of buttons all reading "La tengo" says nothing about which row. */
  it('names what it would do, and to what', () => {
    setup(false)
    expect(
      screen.getByRole('button', {name: 'Añadir Tomate a la despensa'}),
    ).toBeInTheDocument()
  })

  it('offers to take it back out once it is in', () => {
    setup(true)
    expect(
      screen.getByRole('button', {name: 'Quitar Tomate de la despensa'}),
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
})
