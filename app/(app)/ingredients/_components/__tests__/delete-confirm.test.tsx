import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {FocusCatcher} from '@/components/focus-catcher'
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
  const {container} = render(
    /* These forms ask the cached list to refresh once the action is done, so
   there has to be one to ask. */
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        {/* No ToastProvider: useToast falls back to a no-op, and the toast
            itself is covered by components/__tests__/toast-provider. A
            second role="alert" in here would make the inline error below
            ambiguous to query. */}
        <FocusCatcher>
          <DeleteConfirm ingredient={TOMATE} onCancel={onCancel} />
        </FocusCatcher>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
  return {onCancel, container}
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

  /* That confirming deletes the right row is proven by e2e/ingredients.spec.ts
     against a real database, where ON DELETE RESTRICT can actually answer. */

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

    /** The row stays put: a refusal is not a deletion with an apology. */
    it('leaves the confirmation open rather than closing on a refusal', async () => {
      remove.mockResolvedValue({error: 'inUse', recipeCount: 2})
      const {container} = setup()
      await userEvent.click(confirm())
      await screen.findByRole('alert')
      expect(confirm()).toBeInTheDocument()
      expect(container.querySelector('[tabindex="-1"]')).not.toHaveFocus()
    })
  })

  /**
   * The row unmounts on success, taking the button that was pressed with it.
   * Without somewhere deliberate to put focus it falls to the body and the
   * page loses its place. What was deleted is said by a toast.
   */
  it('catches focus on the list as the row goes', async () => {
    const {container} = setup()
    await userEvent.click(confirm())
    await waitFor(() =>
      expect(container.querySelector('[tabindex="-1"]')).toHaveFocus(),
    )
  })
})
