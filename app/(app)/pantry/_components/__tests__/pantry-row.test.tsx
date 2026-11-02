import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {PantryItem} from '@/db/pantry/queries'
import messages from '@/messages/es.json'
import {PantryRow} from '../pantry-row'

const update = vi.fn()
const remove = vi.fn()
vi.mock('../../actions', () => ({
  updatePantryEntryAction: (...a: unknown[]) => update(...a),
  removeFromPantryAction: (...a: unknown[]) => remove(...a),
}))

const m = messages.pantry

const item = (
  quantity: number | null,
  unit: PantryItem['unit'] = null,
): PantryItem => ({
  ingredientId: 'i1',
  name: 'Tomate',
  photoUrl: null,
  quantity,
  unit,
})

/* The row's buttons ask the cached list to refresh itself once they are
   done, so there has to be one to ask. */
const setup = (it: PantryItem) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        <ul>
          <PantryRow item={it} />
        </ul>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )

const amount = () => screen.getByRole('button', {name: /cantidad de Tomate/})

beforeEach(() => {
  update.mockReset()
  remove.mockReset()
  update.mockResolvedValue({done: true})
  remove.mockResolvedValue({done: true})
})

describe('PantryRow', () => {
  it('shows the amount with its unit', () => {
    setup(item(500, 'g'))
    expect(amount()).toHaveTextContent('500 g')
  })

  /**
   * WCAG 2.5.3. The name used to be "Cantidad de Tomate" while the button
   * read "500 g", so saying what is written on it reached nothing.
   */
  it('opens its accessible name with the words on it', () => {
    setup(item(500, 'g'))
    expect(amount()).toHaveAccessibleName('500 g, cantidad de Tomate')
  })

  /** Salt is had, not measured — a null quantity is a real answer. */
  it('says so when there is no amount', () => {
    setup(item(null))
    expect(amount()).toHaveTextContent(m.noAmount)
  })

  it('leaves out a unit that was never set', () => {
    setup(item(3))
    expect(amount()).toHaveTextContent('3')
    expect(amount().textContent?.trim()).toBe('3')
  })

  describe('editing the amount', () => {
    const open = async () => {
      setup(item(500, 'g'))
      await userEvent.click(amount())
    }

    it('starts from what is there', async () => {
      await open()
      expect(screen.getByRole('spinbutton', {name: m.quantity})).toHaveValue(
        500,
      )
      expect(screen.getByRole('combobox', {name: m.unit})).toHaveValue('g')
    })

    it('moves focus into the form', async () => {
      await open()
      expect(screen.getByRole('spinbutton', {name: m.quantity})).toHaveFocus()
    })

    /** An amount needs both halves, so there is no way to clear one. */
    it('offers a unit placeholder that cannot be chosen', async () => {
      await open()
      const placeholder = screen.getByRole('option', {name: m.chooseUnit})
      expect(placeholder).toBeDisabled()
    })

    it('will not submit without a quantity', async () => {
      await open()
      await userEvent.clear(screen.getByRole('spinbutton', {name: m.quantity}))
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      expect(update).not.toHaveBeenCalled()
    })

    it('sends the ingredient it belongs to', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.get('id')).toBe('i1')
    })

    it('returns focus to the amount on cancel', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.cancel}))
      expect(amount()).toHaveFocus()
    })
  })

  /** Nothing is destroyed, so there is nothing to confirm. */
  it('removes without asking, and names what it removes', async () => {
    setup(item(1))
    const button = screen.getByRole('button', {
      name: 'Quitar Tomate de la despensa',
    })
    await userEvent.click(button)
    const form = remove.mock.calls[0]?.[1] as FormData
    expect(form.get('id')).toBe('i1')
  })
})
