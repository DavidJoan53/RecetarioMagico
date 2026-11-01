import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {Recipe, RecipePage} from '@/db/recipes/queries'
import {PAGE_SIZE} from '@/lib/validation/page'
import messages from '@/messages/es.json'
import {RecipePages} from '../recipe-pages'

const m = messages.common
const loadMore = `Cargar ${PAGE_SIZE} más`

const recipe = (id: string): Recipe => ({
  id,
  name: `Receta ${id}`,
  prepTimeMinutes: 10,
  instructions: [],
  links: [],
  imageUrl: null,
  createdAt: new Date('2026-01-01'),
})

const page = (ids: string[], nextCursor: string | null): RecipePage => ({
  items: ids.map(recipe),
  nextCursor,
})

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

/**
 * Keyed by cursor, because the list is seeded stale and reconciles the first
 * page on mount — a mock that answered everything the same replaced page one
 * with page two and looked like the list was being thrown away.
 */
function mockPages(pages: Record<string, RecipePage>) {
  const fetched = vi.fn(async (url: string) => {
    const after = new URL(url, 'http://x').searchParams.get('after') ?? ''
    return {ok: true, json: async () => pages[after] ?? page([], null)}
  })
  vi.stubGlobal('fetch', fetched)
  return fetched
}

function setup(initialPage: RecipePage) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <RecipePages initialPage={initialPage} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

describe('RecipePages', () => {
  /** Handed over from the server, so there is no empty first paint. */
  it('shows the page it was given before anything is fetched', () => {
    mockPages({'': page(['a'], null)})
    setup(page(['a'], null))
    expect(screen.getByText('Receta a')).toBeInTheDocument()
  })

  it('offers no more when the first page is the only one', () => {
    mockPages({'': page(['a'], null)})
    setup(page(['a'], null))
    expect(screen.queryByRole('button', {name: loadMore})).toBeNull()
  })

  /**
   * The point of paging this way: the first page is still there underneath,
   * so the list grows downwards instead of being replaced.
   */
  it('adds the next page below the one already read', async () => {
    mockPages({'': page(['a'], 'a'), a: page(['b'], null)})
    setup(page(['a'], 'a'))

    await userEvent.click(screen.getByRole('button', {name: loadMore}))

    expect(await screen.findByText('Receta b')).toBeInTheDocument()
    expect(screen.getByText('Receta a')).toBeInTheDocument()
  })

  it('asks for what comes after the last recipe read', async () => {
    const fetched = mockPages({'': page(['a'], 'a'), a: page(['b'], null)})
    setup(page(['a'], 'a'))

    await userEvent.click(screen.getByRole('button', {name: loadMore}))

    await waitFor(() =>
      expect(fetched.mock.calls.map(call => call[0])).toContain(
        '/api/recipes?after=a',
      ),
    )
  })

  /**
   * Seeded from the server and stale at once, so a recipe added since that
   * render is not missing until the cache happens to expire.
   */
  it('confirms the first page against the server', async () => {
    const fetched = mockPages({'': page(['a'], null)})
    setup(page(['a'], null))
    await waitFor(() =>
      expect(fetched.mock.calls.map(call => call[0])).toContain(
        '/api/recipes?',
      ),
    )
  })

  it('says it is loading while the next page is on its way', async () => {
    let release = () => {}
    mockPages({'': page(['a'], 'a')})
    const previous = globalThis.fetch
    vi.stubGlobal('fetch', async (url: string) => {
      if (!url.includes('after=')) return (previous as typeof fetch)(url)
      await new Promise(resolve => {
        release = () => resolve(undefined)
      })
      return {ok: true, json: async () => page(['b'], null)}
    })
    setup(page(['a'], 'a'))

    await userEvent.click(screen.getByRole('button', {name: loadMore}))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(m.loadingMore),
    )

    release()
    await screen.findByText('Receta b')
  })
})
