import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import type {RecipeIngredient} from '@/db/recipes/queries'
import messages from '@/messages/es.json'
import {RecipeIngredientFields} from '../recipe-ingredient-fields'

const m = messages.recipeForm

const option = (name: string): IngredientWithPantry => ({
  id: `id-${name}`,
  name,
  photoUrl: null,
  inPantry: false,
})

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    json: async () => ({
      items: [option('Tomate'), option('Cebolla')],
      nextCursor: null,
    }),
  }))
})
afterEach(() => vi.unstubAllGlobals())

function setup(initial?: RecipeIngredient[]) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  const {container} = render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <form aria-label="receta">
          <RecipeIngredientFields initial={initial} />
        </form>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
  const form = container.querySelector('form')
  if (!form) throw new Error('no form rendered')
  /* What the browser would actually send. Not a mock: the real serialisation
     of the real DOM, which is the only thing that can show three parallel
     fields drifting out of step. */
  return {submitted: () => new FormData(form)}
}

const addRow = () =>
  userEvent.click(screen.getByRole('button', {name: `+ ${m.addIngredient}`}))

async function pick(rowNumber: number, name: string) {
  await userEvent.click(
    screen.getByRole('combobox', {
      name: m.ingredientN.replace('{n}', String(rowNumber)),
    }),
  )
  await userEvent.click(await screen.findByRole('option', {name}))
}

const ingredient = (
  name: string,
  quantity: number,
  unit: RecipeIngredient['unit'],
): RecipeIngredient => ({ingredientId: `id-${name}`, name, quantity, unit})

describe('RecipeIngredientFields', () => {
  it('starts with nothing but a way to add one', () => {
    setup()
    expect(screen.getByText(m.noIngredients)).toBeVisible()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  /**
   * The rule a row of identical controls breaks: every "Quitar" button in a
   * column reads the same, so the one for the right ingredient cannot be
   * found by name.
   */
  it('names each row’s controls after the ingredient they are about', async () => {
    setup()
    await addRow()
    await pick(1, 'Tomate')

    expect(
      screen.getByRole('spinbutton', {
        name: m.quantityOf.replace('{name}', 'Tomate'),
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {
        name: m.unitOf.replace('{name}', 'Tomate'),
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: m.removeIngredient.replace('{name}', 'Tomate'),
      }),
    ).toBeInTheDocument()
  })

  /** Before anything is picked there is no subject, so position is the name. */
  it('falls back to the row’s position until something is chosen', async () => {
    setup()
    await addRow()
    expect(
      screen.getByRole('spinbutton', {
        name: m.quantityOf.replace('{name}', m.ingredientN.replace('{n}', '1')),
      }),
    ).toBeInTheDocument()
  })

  it('submits each ingredient beside its own amount', async () => {
    const {submitted} = setup()
    await addRow()
    await pick(1, 'Tomate')
    await userEvent.type(
      screen.getByRole('spinbutton', {
        name: m.quantityOf.replace('{name}', 'Tomate'),
      }),
      '200',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: m.unitOf.replace('{name}', 'Tomate'),
      }),
      'g',
    )

    await addRow()
    await pick(2, 'Cebolla')
    await userEvent.type(
      screen.getByRole('spinbutton', {
        name: m.quantityOf.replace('{name}', 'Cebolla'),
      }),
      '1',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: m.unitOf.replace('{name}', 'Cebolla'),
      }),
      'unidad',
    )

    const form = submitted()
    expect(form.getAll('ingredientId')).toEqual(['id-Tomate', 'id-Cebolla'])
    expect(form.getAll('ingredientQuantity')).toEqual(['200', '1'])
    expect(form.getAll('ingredientUnit')).toEqual(['g', 'unidad'])
  })

  /**
   * The failure this guards against is silent: a row that skipped its hidden
   * field would shift every later row's amount onto the wrong ingredient,
   * and the recipe would save with amounts that look plausible.
   */
  it('keeps the three fields in step when a row is left empty', async () => {
    const {submitted} = setup()
    await addRow()
    await addRow()
    await pick(2, 'Cebolla')

    const form = submitted()
    expect(form.getAll('ingredientId')).toEqual(['', 'id-Cebolla'])
    expect(form.getAll('ingredientQuantity')).toHaveLength(2)
    expect(form.getAll('ingredientUnit')).toHaveLength(2)
  })

  it('removes the row asked for, not the one at that position', async () => {
    const {submitted} = setup()
    await addRow()
    await pick(1, 'Tomate')
    await addRow()
    await pick(2, 'Cebolla')

    await userEvent.click(
      screen.getByRole('button', {
        name: m.removeIngredient.replace('{name}', 'Tomate'),
      }),
    )
    expect(submitted().getAll('ingredientId')).toEqual(['id-Cebolla'])
  })

  /** Hiding it would make "no such ingredient" look the same as "already in". */
  it('marks an ingredient already chosen in another row', async () => {
    setup()
    await addRow()
    await pick(1, 'Tomate')
    await addRow()

    await userEvent.click(
      screen.getByRole('combobox', {name: m.ingredientN.replace('{n}', '2')}),
    )
    expect(
      await screen.findByRole('option', {name: `Tomate ${m.alreadyInRecipe}`}),
    ).toBeInTheDocument()
    /* Its own choice is not a clash with itself. */
    expect(screen.getByRole('option', {name: 'Cebolla'})).toBeInTheDocument()
  })

  describe('when an existing recipe is being edited', () => {
    const initial = [ingredient('Tomate', 200, 'g')]

    it('starts on what the recipe already says', () => {
      const {submitted} = setup(initial)
      expect(
        screen.getByRole('combobox', {name: m.ingredientN.replace('{n}', '1')}),
      ).toHaveValue('Tomate')

      const form = submitted()
      expect(form.getAll('ingredientId')).toEqual(['id-Tomate'])
      expect(form.getAll('ingredientQuantity')).toEqual(['200'])
      expect(form.getAll('ingredientUnit')).toEqual(['g'])
    })

    /**
     * Typing over the name abandons the choice. Left standing, the box would
     * read one ingredient while submitting another.
     */
    it('drops the choice when the name is typed over', async () => {
      const {submitted} = setup(initial)
      await userEvent.type(
        screen.getByRole('combobox', {name: m.ingredientN.replace('{n}', '1')}),
        'x',
      )
      expect(submitted().getAll('ingredientId')).toEqual([''])
    })
  })
})
