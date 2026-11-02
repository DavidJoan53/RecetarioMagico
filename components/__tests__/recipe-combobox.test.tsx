import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {RecipeCombobox} from '../recipe-combobox'

const m = messages.dinners

const AREPA = {
  id: 'r1',
  name: 'Arepa',
  prepTimeMinutes: 20,
  instructions: [],
  links: [],
  imageUrl: null,
  createdAt: '2026-10-30T20:00:00.000Z',
}

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

function setup(
  isChosen?: (recipe: {id: string}) => boolean,
  respond?: (url: string) => {ok: boolean; json: () => Promise<unknown>},
) {
  const fetched = vi.fn(async (url: string) =>
    respond
      ? respond(url)
      : {ok: true, json: async () => ({items: [AREPA], nextCursor: null})},
  )
  vi.stubGlobal('fetch', fetched)

  const onChange = vi.fn()
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <RecipeCombobox onChange={onChange} isChosen={isChosen} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )

  return {
    onChange,
    fetched,
    input: screen.getByRole('combobox', {name: m.recipes}),
  }
}

describe('RecipeCombobox', () => {
  it('hands back the recipe that was picked', async () => {
    const {input, onChange} = setup()
    await userEvent.click(input)
    await userEvent.click(await screen.findByRole('option', {name: /Arepa/}))
    expect(onChange).toHaveBeenCalledWith(AREPA)
  })

  /** It collects several, and the chosen one is shown as a chip elsewhere. */
  it('empties itself ready for the next one', async () => {
    const {input} = setup()
    await userEvent.click(input)
    await userEvent.click(await screen.findByRole('option', {name: /Arepa/}))
    expect(input).toHaveValue('')
  })

  /**
   * Marked, not hidden: dropped from the list, "not written down yet" and
   * "already on this dinner" look exactly alike.
   */
  it('marks what is already on the dinner', async () => {
    const {input} = setup(recipe => recipe.id === 'r1')
    await userEvent.click(input)
    expect(
      await screen.findByRole('option', {name: `Arepa ${m.alreadyAdded}`}),
    ).toBeInTheDocument()
  })

  it('leaves the rest unmarked', async () => {
    const {input} = setup(() => false)
    await userEvent.click(input)
    expect(
      await screen.findByRole('option', {name: 'Arepa'}),
    ).toBeInTheDocument()
  })

  /**
   * The sentinel at the bottom of the list is what asks for the next page,
   * so the observer has to actually reach it for this to be exercised.
   */
  it('reads on past the first page', async () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly fire: (entries: unknown[]) => void) {}
        observe() {
          this.fire([{isIntersecting: true}])
        }
        disconnect() {}
      },
    )

    const SOPA = {...AREPA, id: 'r2', name: 'Sopa'}
    const {input, fetched} = setup(undefined, url =>
      url.includes('after=r1')
        ? {ok: true, json: async () => ({items: [SOPA], nextCursor: null})}
        : {ok: true, json: async () => ({items: [AREPA], nextCursor: 'r1'})},
    )

    await userEvent.click(input)
    expect(await screen.findByRole('option', {name: /Sopa/})).toBeVisible()
    expect(fetched).toHaveBeenCalledWith(expect.stringContaining('after=r1'))
  })

  /** A failed search is an empty list, not a list of the last search. */
  it('says nothing matched when the search fails', async () => {
    const {input} = setup(undefined, () => ({
      ok: false,
      json: async () => ({}),
    }))
    await userEvent.click(input)
    expect(await screen.findByText(m.noMatches)).toBeInTheDocument()
  })

  /** Without it the picker lists every recipe and typing narrows nothing. */
  it('asks the endpoint to narrow by what was typed', async () => {
    const {input, fetched} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Arepa/})

    await userEvent.type(input, 'are')
    await waitFor(() =>
      expect(fetched).toHaveBeenCalledWith(
        expect.stringContaining('query=are'),
      ),
    )
  })
})
