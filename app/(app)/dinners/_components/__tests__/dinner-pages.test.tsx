import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {DinnerPage} from '@/db/dinners/queries'
import {timeZone} from '@/i18n/time-zone'
import {PAGE_SIZE} from '@/lib/validation/page'
import messages from '@/messages/es.json'
import {DinnerPages} from '../dinner-pages'

const m = messages.dinners
const loadMore = `Cargar ${PAGE_SIZE} más`

const removed = vi.hoisted(() => vi.fn())
vi.mock('../../actions', () => ({
  deleteDinnerAction: removed,
  updateDinnerAction: vi.fn(),
}))

const dinner = (id: string, recipe: string) => ({
  id,
  eatenAt: '2026-11-02T01:00:00.000Z',
  notes: null,
  recipes: [{id: `${id}-r`, name: recipe, imageUrl: null}],
})

const page = (
  entries: [string, string][],
  nextCursor: string | null,
): DinnerPage => ({
  items: entries.map(([id, recipe]) => dinner(id, recipe)),
  nextCursor,
})

const date = new Intl.DateTimeFormat('es', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone,
}).format(new Date('2026-11-02T01:00:00.000Z'))

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

function mockPages(pages: Record<string, DinnerPage>) {
  const fetched = vi.fn(async (url: string) => {
    const after = new URL(url, 'http://x').searchParams.get('after') ?? ''
    return {ok: true, json: async () => pages[after] ?? page([], null)}
  })
  vi.stubGlobal('fetch', fetched)
  return fetched
}

function setup(initialPage: DinnerPage) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone={timeZone}>
      <QueryClientProvider client={client}>
        <DinnerPages initialPage={initialPage} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

/* Rendering the first page and appending the next is the same
   useInfiniteQuery wiring on all four lists, proven once in recipe-pages.
   What is specific to this one is the compound cursor and its query key. */
describe('DinnerPages', () => {
  /** A dinner's cursor is `instant|id`, so it has to survive encoding. */
  it('passes the cursor the last page ended on', async () => {
    const cursor = '2026-11-02T01:00:00.000Z|d1'
    const fetched = mockPages({
      '': page([['d1', 'Arepa']], cursor),
      [cursor]: page([['d2', 'Café']], null),
    })
    setup(page([['d1', 'Arepa']], cursor))

    await userEvent.click(screen.getByRole('button', {name: loadMore}))

    await waitFor(() =>
      expect(fetched).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(cursor)),
      ),
    )
  })

  /**
   * The list reads its own cache, not the server render, so revalidatePath
   * alone leaves a deleted dinner on screen with nothing to say it has gone.
   */
  it('asks for the list again after one is deleted', async () => {
    removed.mockResolvedValue({})
    const fetched = mockPages({'': page([['d1', 'Arepa']], null)})
    setup(page([['d1', 'Arepa']], null))
    await waitFor(() => expect(fetched).toHaveBeenCalled())
    fetched.mockClear()

    await userEvent.click(
      screen.getByRole('button', {name: m.deleteLabel.replace('{date}', date)}),
    )
    await userEvent.click(
      screen.getByRole('button', {name: m.confirmDeleteAction}),
    )

    await waitFor(() => expect(fetched).toHaveBeenCalled())
  })
})
