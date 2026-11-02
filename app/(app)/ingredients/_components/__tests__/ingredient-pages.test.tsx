import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {IngredientPage} from '@/db/ingredients/queries'
import messages from '@/messages/es.json'
import {IngredientPages} from '../ingredient-pages'

const m = messages.ingredients

const deleted = vi.hoisted(() => vi.fn())
vi.mock('../../actions', () => ({
  deleteIngredientAction: deleted,
  updateIngredientAction: vi.fn(),
  createIngredientAction: vi.fn(),
}))

const ingredient = (name: string) => ({
  id: name,
  name,
  photoUrl: null,
  inPantry: false,
})

const page = (names: string[], nextCursor: string | null): IngredientPage => ({
  items: names.map(ingredient),
  nextCursor,
})

beforeEach(() => {
  deleted.mockReset()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function mockPages(pages: Record<string, IngredientPage>) {
  const fetched = vi.fn(async (url: string) => {
    const after = new URL(url, 'http://x').searchParams.get('after') ?? ''
    return {ok: true, json: async () => pages[after] ?? page([], null)}
  })
  vi.stubGlobal('fetch', fetched)
  return fetched
}

function setup(initialPage: IngredientPage) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <IngredientPages initialPage={initialPage} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

/* Rendering the first page and appending the next is the same
   useInfiniteQuery wiring on all four lists, proven once in recipe-pages.
   What is specific to this one is its query key. */
describe('IngredientPages', () => {
  /**
   * The list reads its own cache, not the server render, so revalidatePath
   * alone leaves a deleted row on screen with nothing to say it has gone.
   */
  it('asks for the list again after one is deleted', async () => {
    deleted.mockResolvedValue({})
    const fetched = mockPages({'': page(['Ajo'], null)})
    setup(page(['Ajo'], null))
    await waitFor(() => expect(fetched).toHaveBeenCalled())
    fetched.mockClear()

    await userEvent.click(
      screen.getByRole('button', {
        name: m.deleteLabel.replace('{name}', 'Ajo'),
      }),
    )
    await userEvent.click(
      screen.getByRole('button', {name: m.confirmDeleteAction}),
    )

    await waitFor(() => expect(fetched).toHaveBeenCalled())
  })
})
