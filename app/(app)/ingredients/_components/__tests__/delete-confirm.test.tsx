import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {DeletionAnnouncer} from '@/components/deletion-announcer'
import type {Ingredient} from '@/db/schema'
import messages from '@/messages/es.json'
import {DeleteConfirm} from '../delete-confirm'

const remove = vi.fn()
vi.mock('../../actions', () => ({
  deleteIngredientAction: (...args: unknown[]) => remove(...args),
}))

const m = messages.ingredients

const TOMATE: Ingredient = {
  id: 'i1',
  name: 'Tomate',
  photoUrl: null,
}

const setup = () => {
  const onCancel = vi.fn()
  render(
    /* These forms ask the cached list to refresh once the action is done, so
   there has to be one to ask. */
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        <DeletionAnnouncer>
          <DeleteConfirm ingredient={TOMATE} onCancel={onCancel} />
        </DeletionAnnouncer>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
  return {onCancel}
}

const confirm = () => screen.getByRole('button', {name: m.confirmDeleteAction})

beforeEach(() => {
  remove.mockReset()
  remove.mockResolvedValue({})
})

describe('DeleteConfirm', () => {
  it('asks about the ingredient by name', () => {
    setup()
    expect(screen.getByText('¿Eliminar Tomate?')).toBeInTheDocument()
  })

  /** The pantry row is ON DELETE CASCADE; nothing else would mention it. */
  it('says the pantry entry goes too', () => {
    setup()
    expect(screen.getByText(m.alsoLeavesPantry)).toBeInTheDocument()
  })

  /** Return is the common key, so it should not be the destructive one. */
  it('opens with focus on the way out, not on the delete', () => {
    setup()
    expect(screen.getByRole('button', {name: m.cancel})).toHaveFocus()
    expect(confirm()).not.toHaveFocus()
  })

  it('sends the id', async () => {
    setup()
    await userEvent.click(confirm())
    const form = remove.mock.calls[0]?.[1] as FormData
    expect(form.get('id')).toBe('i1')
  })

  it('leaves without deleting when cancelled', async () => {
    const {onCancel} = setup()
    await userEvent.click(screen.getByRole('button', {name: m.cancel}))
    expect(onCancel).toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  describe('when the ingredient is in use', () => {
    /**
     * recipe_ingredients is ON DELETE RESTRICT, so this is a real answer from
     * the database rather than a guard the UI invented.
     */
    it('says how many recipes are holding it', async () => {
      remove.mockResolvedValue({error: 'inUse', recipeCount: 3})
      setup()
      await userEvent.click(confirm())
      expect(await screen.findByRole('alert')).toHaveTextContent('3 recetas')
    })

    it('uses the singular for one recipe', async () => {
      remove.mockResolvedValue({error: 'inUse', recipeCount: 1})
      setup()
      await userEvent.click(confirm())
      expect(await screen.findByRole('alert')).toHaveTextContent('1 receta')
    })

    it('says nothing was deleted', async () => {
      remove.mockResolvedValue({error: 'inUse', recipeCount: 2})
      setup()
      await userEvent.click(confirm())
      await screen.findByRole('alert')
      expect(screen.getByRole('status')).toHaveTextContent('')
    })
  })

  /** The row unmounts on success, so this is the only word the user gets. */
  it('announces the deletion before the row disappears', async () => {
    setup()
    await userEvent.click(confirm())
    expect(await screen.findByText('Tomate eliminado')).toBeInTheDocument()
  })
})
