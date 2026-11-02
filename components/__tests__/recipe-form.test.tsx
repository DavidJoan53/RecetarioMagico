import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {FormState} from '@/app/(app)/recipes/actions'
import type {RecipeWithIngredients} from '@/db/recipes/queries'
import messages from '@/messages/es.json'
import {RecipeForm} from '../recipe-form'
import {ToastProvider} from '../toast-provider'

/* The ingredient rows carry a combobox, which pages its results. */
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

const setup = (
  state: FormState = {},
  recipe?: RecipeWithIngredients,
  /* Off by default: the provider's always-mounted role="alert" region would
     make every inline field-error query below find two alerts. */
  withToasts = false,
) => {
  const action = vi.fn(async () => state)
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  const form = (
    <RecipeForm
      action={action}
      submitLabel={messages.recipeForm.create}
      recipe={recipe}
    />
  )
  const {container} = render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        {withToasts ? <ToastProvider>{form}</ToastProvider> : form}
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
  const element = container.querySelector('form')
  if (!element) throw new Error('no form rendered')
  return {action, submitted: () => new FormData(element)}
}

describe('RecipeForm', () => {
  it('labels every control so it can be found by name', () => {
    setup()
    expect(
      screen.getByRole('textbox', {name: messages.recipeForm.name}),
    ).toBeRequired()
    expect(
      screen.getByRole('spinbutton', {name: messages.recipeForm.minutes}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {name: messages.recipeForm.instructions}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {name: messages.recipeForm.links}),
    ).toBeInTheDocument()
  })

  it('submits to the action given to it', async () => {
    const {action} = setup()
    await userEvent.type(
      screen.getByRole('textbox', {name: messages.recipeForm.name}),
      'Arepa',
    )
    await userEvent.click(
      screen.getByRole('button', {name: messages.recipeForm.create}),
    )
    expect(action).toHaveBeenCalled()
  })

  it('offers a way out that does not submit', () => {
    setup()
    expect(
      screen.getByRole('link', {name: messages.recipeForm.cancel}),
    ).toHaveAttribute('href', '/recipes')
  })

  describe('when the action reports a problem', () => {
    /** The state only exists after the action runs, so submit first. */
    const submit = async (state: FormState) => {
      setup(state)
      await userEvent.type(
        screen.getByRole('textbox', {name: messages.recipeForm.name}),
        'Arepa',
      )
      await userEvent.click(
        screen.getByRole('button', {name: messages.recipeForm.create}),
      )
      return screen.findByRole('alert')
    }

    /** An alert reaches a screen reader without the user going looking. */
    it('announces a duplicate name rather than only colouring it', async () => {
      const alert = await submit({error: 'duplicateName'})
      expect(alert).toHaveTextContent(messages.recipeForm.duplicateName)
    })

    it('announces a validation failure', async () => {
      const alert = await submit({error: 'invalid'})
      expect(alert).toHaveTextContent(messages.recipeForm.invalid)
    })

    /* Each its own test: a loop would render a second form into the first
       one's container, and every query would then find two of everything. */
    it('announces a repeated ingredient', async () => {
      const alert = await submit({error: 'duplicateIngredient'})
      expect(alert).toHaveTextContent(messages.recipeForm.duplicateIngredient)
    })

    /**
     * These two name nothing on the form. An ingredient that has been deleted
     * elsewhere and a recipe that has been deleted elsewhere are both answers
     * about the write, not about a field, so they go to a toast and the form
     * says nothing — there is no field for it to mark.
     */
    const submitWithToasts = async (state: FormState) => {
      setup(state, undefined, true)
      await userEvent.type(
        screen.getByRole('textbox', {name: messages.recipeForm.name}),
        'Arepa',
      )
      await userEvent.click(
        screen.getByRole('button', {name: messages.recipeForm.create}),
      )
    }

    it('sends a gone ingredient to a toast, not to the form', async () => {
      await submitWithToasts({error: 'ingredientGone'})
      expect(
        await screen.findByRole('button', {
          name: `Descartar: ${messages.recipeForm.ingredientGone}`,
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('textbox', {name: messages.recipeForm.name}),
      ).not.toHaveAttribute('aria-invalid')
    })

    it('sends a gone recipe to a toast, not to the form', async () => {
      await submitWithToasts({error: 'gone'})
      expect(
        await screen.findByRole('button', {
          name: `Descartar: ${messages.recipeForm.gone}`,
        }),
      ).toBeInTheDocument()
    })

    /** A message about an ingredient must not point at the name field. */
    it('marks the name invalid only when the name is what is wrong', async () => {
      const alert = await submit({error: 'duplicateIngredient'})
      const name = screen.getByRole('textbox', {name: messages.recipeForm.name})
      expect(alert).toBeInTheDocument()
      expect(name).not.toHaveAttribute('aria-invalid')
    })

    it('ties the message to the field it is about', async () => {
      const alert = await submit({error: 'duplicateName'})
      const name = screen.getByRole('textbox', {name: messages.recipeForm.name})
      expect(name).toHaveAttribute('aria-invalid', 'true')
      expect(name.getAttribute('aria-describedby')).toBe(alert.id)
    })
  })

  it('shows no alert before anything has gone wrong', () => {
    setup()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  describe('when an existing recipe is being edited', () => {
    const recipe: RecipeWithIngredients = {
      id: 'r1',
      name: 'Arepa de huevo',
      prepTimeMinutes: 25,
      instructions: ['Amasar', 'Freír'],
      links: ['https://youtu.be/dQw4w9WgXcQ'],
      imageUrl: null,
      createdAt: new Date('2026-01-01'),
      ingredients: [
        {ingredientId: 'i1', name: 'Tomate', quantity: 200, unit: 'g'},
      ],
    }

    it('starts on what the recipe already says', () => {
      setup({}, recipe)
      expect(
        screen.getByRole('textbox', {name: messages.recipeForm.name}),
      ).toHaveValue('Arepa de huevo')
      expect(
        screen.getByRole('spinbutton', {name: messages.recipeForm.minutes}),
      ).toHaveValue(25)
      expect(screen.getByRole('textbox', {name: 'Paso 1'})).toHaveValue(
        'Amasar',
      )
      expect(screen.getByRole('textbox', {name: 'Enlace 1'})).toHaveValue(
        'https://youtu.be/dQw4w9WgXcQ',
      )
    })

    /** Which recipe is being saved — the only thing telling the two apart. */
    it('submits the id of the recipe it is editing', () => {
      const {submitted} = setup({}, recipe)
      expect(submitted().get('id')).toBe('r1')
      expect(submitted().getAll('ingredientId')).toEqual(['i1'])
    })

    it('creates without an id, so the action knows it is a new one', () => {
      const {submitted} = setup()
      expect(submitted().get('id')).toBeNull()
    })

    /** Backing out of an edit returns to the recipe, not to the whole list. */
    it('cancels back to the recipe being edited', () => {
      setup({}, recipe)
      expect(
        screen.getByRole('link', {name: messages.recipeForm.cancel}),
      ).toHaveAttribute('href', '/recipes/r1')
    })
  })

  /** The labels are callbacks, so they only run once a row exists to name. */
  it('numbers added steps and links, and names their remove controls', async () => {
    setup()
    await userEvent.click(
      screen.getByRole('button', {name: `+ ${messages.recipeForm.addStep}`}),
    )
    await userEvent.click(
      screen.getByRole('button', {name: `+ ${messages.recipeForm.addLink}`}),
    )

    expect(screen.getByRole('textbox', {name: 'Paso 2'})).toBeInTheDocument()
    expect(screen.getByRole('textbox', {name: 'Enlace 2'})).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Quitar paso 2'}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Quitar enlace 2'}),
    ).toBeInTheDocument()
  })
})
