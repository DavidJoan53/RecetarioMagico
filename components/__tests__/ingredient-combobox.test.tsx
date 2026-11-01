import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import messages from '@/messages/es.json'
import {IngredientCombobox} from '../ingredient-combobox'

const m = messages.pantry

const ingredient = (name: string, inPantry = false): IngredientWithPantry => ({
  id: name,
  name,
  photoUrl: null,
  inPantry,
})

/** Nothing observes in jsdom, so paging is driven by the test instead. */
let observed: (() => void) | null = null
beforeEach(() => {
  observed = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: (e: {isIntersecting: boolean}[]) => void) {
        observed = () => this.cb([{isIntersecting: true}])
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function mockSearch(pages: Record<string, IngredientWithPantry[]>) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const params = new URL(url, 'http://x').searchParams
      const after = params.get('after') ?? ''
      calls.push(`${params.get('query') ?? ''}|${after}`)
      const items = pages[after] ?? []
      return {
        ok: true,
        json: async () => ({
          items,
          nextCursor: pages[items.at(-1)?.name ?? '']
            ? items.at(-1)?.name
            : null,
        }),
      }
    }),
  )
  return calls
}

const setup = () => {
  const onChange = vi.fn()
  const client = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  })
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <IngredientCombobox value={null} onChange={onChange} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
  return {onChange, input: screen.getByRole('combobox', {name: m.ingredient})}
}

describe('IngredientCombobox', () => {
  it('is closed until it is used', () => {
    mockSearch({})
    const {input} = setup()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens on focus and lists what came back', async () => {
    mockSearch({'': [ingredient('Ajo'), ingredient('Cebolla')]})
    const {input} = setup()
    await userEvent.click(input)
    expect(await screen.findByRole('option', {name: /Ajo/})).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('marks what is already in the pantry', async () => {
    mockSearch({'': [ingredient('Ajo', true)]})
    const {input} = setup()
    await userEvent.click(input)
    expect(
      await screen.findByRole('option', {name: /ya está/}),
    ).toBeInTheDocument()
  })

  /**
   * The point of aria-activedescendant: focus stays in the text being typed
   * while the arrow keys move through the list.
   */
  it('moves the active option without moving focus', async () => {
    mockSearch({'': [ingredient('Ajo'), ingredient('Cebolla')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{ArrowDown}')
    const second = screen.getByRole('option', {name: /Cebolla/})
    expect(input).toHaveAttribute('aria-activedescendant', second.id)
    expect(input).toHaveFocus()
  })

  it('wraps around at the end of the list', async () => {
    mockSearch({'': [ingredient('Ajo'), ingredient('Cebolla')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{ArrowUp}')
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', {name: /Cebolla/}).id,
    )
  })

  it('chooses the active option on Enter', async () => {
    mockSearch({'': [ingredient('Ajo')]})
    const {input, onChange} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Ajo'}),
    )
    expect(input).toHaveValue('Ajo')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes on Escape without choosing', async () => {
    mockSearch({'': [ingredient('Ajo')]})
    const {input, onChange} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  /** The list appearing is a visual event; a count is the audible one. */
  it('says how many matches there are', async () => {
    mockSearch({'': [ingredient('Ajo'), ingredient('Cebolla')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('2 resultados'),
    )
  })

  it('says when nothing matches', async () => {
    mockSearch({})
    const {input} = setup()
    await userEvent.click(input)
    expect(await screen.findByText(m.noMatches)).toBeInTheDocument()
  })

  /** One request per word typed, not one per letter. */
  it('waits for typing to stop before searching again', async () => {
    const calls = mockSearch({'': [ingredient('Ajo')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.type(input, 'ceb')
    expect(calls.filter(c => c.startsWith('ceb'))).toHaveLength(0)
    await waitFor(() => expect(calls.some(c => c.startsWith('ceb'))).toBe(true))
  })

  it('asks for the next page when the end of the list is reached', async () => {
    const calls = mockSearch({
      '': [ingredient('Ajo')],
      Ajo: [ingredient('Cebolla')],
    })
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    observed?.()
    await waitFor(() => expect(calls).toContain('|Ajo'))
  })
})
