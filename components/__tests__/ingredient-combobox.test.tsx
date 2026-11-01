import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {IngredientWithPantry} from '@/db/ingredients/queries'
import messages from '@/messages/es.json'
import {IngredientCombobox} from '../ingredient-combobox'

const m = messages.pantry
const c = messages.common

const ingredient = (name: string, inPantry = false): IngredientWithPantry => ({
  id: name,
  name,
  photoUrl: null,
  inPantry,
})

/**
 * Nothing observes in jsdom, so paging is driven by the test instead. The
 * stub tracks what it was given and refuses to fire for a node no longer on
 * the page, which is the only way "it stopped watching" is visible here.
 */
let observed: (() => void) | null = null
beforeEach(() => {
  observed = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private targets: Element[] = []
      constructor(private cb: (e: {isIntersecting: boolean}[]) => void) {}
      observe(target: Element) {
        this.targets.push(target)
        observed = () => {
          if (!this.targets.some(node => node.isConnected)) return
          this.cb([{isIntersecting: true}])
        }
      }
      disconnect() {
        this.targets = []
      }
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

  /** Idle is not loading: the row said so for as long as more existed. */
  it('says it is loading only while a page is on its way', async () => {
    let release = () => {}
    mockSearch({'': [ingredient('Ajo')], Ajo: [ingredient('Cebolla')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    /* There is a next page, and nothing is fetching it yet. */
    const list = () => within(screen.getByRole('listbox'))
    expect(list().queryByText(c.loadingMore)).toBeNull()

    const previous = globalThis.fetch
    vi.stubGlobal('fetch', (url: string) => {
      const held = new Promise(resolve => {
        release = () => resolve(undefined)
      })
      return held.then(() => (previous as typeof fetch)(url))
    })

    observed?.()
    await waitFor(() =>
      expect(list().getByText(c.loadingMore)).toBeInTheDocument(),
    )
    expect(screen.getByRole('status')).toHaveTextContent(c.loadingMore)

    release()
    await screen.findByRole('option', {name: /Cebolla/})
    await waitFor(() => expect(list().queryByText(c.loadingMore)).toBeNull())
  })

  /**
   * jsdom has no scroll, so the proof is that nothing asked for one: the only
   * thing that moves the list is reaching a new active option.
   */
  it('stays where it is when another page arrives', async () => {
    mockSearch({'': [ingredient('Ajo')], Ajo: [ingredient('Cebolla')]})
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView')
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    scrolled.mockClear()
    observed?.()
    await screen.findByRole('option', {name: /Cebolla/})
    expect(scrolled).not.toHaveBeenCalled()

    await userEvent.keyboard('{ArrowDown}')
    expect(scrolled).toHaveBeenCalled()
    scrolled.mockRestore()
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

  /** Escape leaves the field focused, so a second click has no focus to go on. */
  it('reopens when the field is clicked again', async () => {
    mockSearch({'': [ingredient('Ajo')]})
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()

    await userEvent.click(input)
    expect(await screen.findByRole('option', {name: /Ajo/})).toBeInTheDocument()
  })

  /** Closing throws the sentinel away; reopening makes a new one to watch. */
  it('asks for the next page again after it is closed and reopened', async () => {
    const calls = mockSearch({
      '': [ingredient('Ajo')],
      Ajo: [ingredient('Cebolla')],
    })
    const {input} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Ajo/})

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()

    await userEvent.keyboard('{ArrowDown}')
    await screen.findByRole('option', {name: /Ajo/})

    observed?.()
    await waitFor(() => expect(calls).toContain('|Ajo'))
  })
})
