import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {PantryPage} from '@/db/pantry/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import messages from '@/messages/es.json'
import {PantryPages} from '../pantry-pages'

const m = messages.pantry
const loadMore = `Cargar ${PAGE_SIZE} más`

const removed = vi.hoisted(() => vi.fn())
vi.mock('../../actions', () => ({
  removeFromPantryAction: removed,
  updatePantryEntryAction: vi.fn(),
}))

const item = (name: string) => ({
  ingredientId: name,
  name,
  photoUrl: null,
  quantity: 1,
  unit: 'g' as const,
})

const page = (names: string[], nextCursor: string | null): PantryPage => ({
  items: names.map(item),
  nextCursor,
})

beforeEach(() => {
  removed.mockReset()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function mockPages(pages: Record<string, PantryPage>) {
  const fetched = vi.fn(async (url: string) => {
    const after = new URL(url, 'http://x').searchParams.get('after') ?? ''
    return {ok: true, json: async () => pages[after] ?? page([], null)}
  })
  vi.stubGlobal('fetch', fetched)
  return fetched
}

function setup(initialPage: PantryPage) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <PantryPages initialPage={initialPage} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

describe('PantryPages', () => {
  it('shows the page it was given', () => {
    mockPages({'': page(['Ajo'], null)})
    setup(page(['Ajo'], null))
    expect(screen.getByRole('list', {name: m.title})).toBeInTheDocument()
    expect(screen.getByText('Ajo')).toBeInTheDocument()
  })

  it('adds the next page below the one already read', async () => {
    mockPages({'': page(['Ajo'], 'Ajo'), Ajo: page(['Cebolla'], null)})
    setup(page(['Ajo'], 'Ajo'))

    await userEvent.click(screen.getByRole('button', {name: loadMore}))

    expect(await screen.findByText('Cebolla')).toBeInTheDocument()
    expect(screen.getByText('Ajo')).toBeInTheDocument()
  })

  /**
   * The list reads its own cache, not the server render, so revalidatePath
   * alone leaves a removed row on screen with nothing to say it has gone.
   */
  it('asks for the list again after something is removed', async () => {
    removed.mockResolvedValue({done: true})
    const fetched = mockPages({'': page(['Ajo'], null)})
    setup(page(['Ajo'], null))
    await waitFor(() => expect(fetched).toHaveBeenCalled())
    fetched.mockClear()

    await userEvent.click(
      screen.getByRole('button', {
        name: m.removeLabel.replace('{name}', 'Ajo'),
      }),
    )

    await waitFor(() => expect(fetched).toHaveBeenCalled())
  })
})
