import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import messages from '@/messages/es.json'
import {IngredientRow} from '../ingredient-row'

const update = vi.fn()
const remove = vi.fn()
vi.mock('../../actions', () => ({
  updateIngredientAction: (...args: unknown[]) => update(...args),
  deleteIngredientAction: (...args: unknown[]) => remove(...args),
}))

const m = messages.ingredients

const TOMATE: IngredientWithPantry = {
  id: 'i1',
  name: 'Tomate',
  photoUrl: null,
  inPantry: false,
}

const setup = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ul>
        <IngredientRow ingredient={TOMATE} />
      </ul>
    </NextIntlClientProvider>,
  )

const editButton = () => screen.getByRole('button', {name: 'Editar Tomate'})
const deleteButton = () => screen.getByRole('button', {name: 'Eliminar Tomate'})

beforeEach(() => {
  update.mockReset()
  remove.mockReset()
  update.mockResolvedValue({done: true})
  remove.mockResolvedValue({})
})

describe('IngredientRow', () => {
  /** A column of buttons all reading "Editar" says nothing about which row. */
  it('names the edit control after the ingredient it edits', () => {
    setup()
    expect(editButton()).toBeInTheDocument()
  })

  it('shows the name, and no form, until asked', () => {
    setup()
    expect(screen.getByText('Tomate')).toBeInTheDocument()
    expect(screen.queryByRole('form')).toBeNull()
  })

  describe('when editing', () => {
    const open = async () => {
      setup()
      await userEvent.click(editButton())
      return screen.getByRole('textbox', {name: m.name})
    }

    it('opens a form named after the ingredient', async () => {
      await open()
      expect(
        screen.getByRole('form', {name: 'Editar Tomate'}),
      ).toBeInTheDocument()
    })

    /** Otherwise the row changes shape and focus is left behind on nothing. */
    it('moves focus into the form', async () => {
      expect(await open()).toHaveFocus()
    })

    it('starts from the current values rather than empty', async () => {
      expect(await open()).toHaveValue('Tomate')
    })

    it('sends the id, so the action knows what it is updating', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.get('id')).toBe('i1')
    })

    it('returns focus to the edit button on cancel', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.cancel}))
      expect(editButton()).toHaveFocus()
    })

    it('closes and returns focus once the change is saved', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      expect(await screen.findByText('Tomate')).toBeInTheDocument()
      expect(editButton()).toHaveFocus()
    })

    /** Both controls restore focus, and each has to go back to its own. */
    it('does not delete', async () => {
      await open()
      expect(screen.queryByText(m.alsoLeavesPantry)).toBeNull()
    })

    it('stays open and says why when the name is taken', async () => {
      update.mockResolvedValue({error: 'duplicateName'})
      const name = await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(m.duplicate)
      expect(name.getAttribute('aria-describedby')).toBe(alert.id)
    })
  })

  describe('when deleting', () => {
    const open = async () => {
      setup()
      await userEvent.click(deleteButton())
    }

    it('asks before doing it', async () => {
      await open()
      expect(screen.getByText('¿Eliminar Tomate?')).toBeInTheDocument()
      expect(remove).not.toHaveBeenCalled()
    })

    /** The row has two ways back; each has to return to the one you used. */
    it('returns focus to the delete button, not the edit one', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.cancel}))
      expect(deleteButton()).toHaveFocus()
      expect(editButton()).not.toHaveFocus()
    })
  })
})
