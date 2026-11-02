import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {AddToPantryForm} from '../add-to-pantry-form'

const m = messages.pantry

const add = vi.hoisted(() => vi.fn())
vi.mock('../../../actions', () => ({addToPantryAction: add}))

/* useRouter needs an app router mounted, which jsdom has none of. */
const {push} = vi.hoisted(() => ({push: vi.fn()}))
vi.mock('next/navigation', () => ({useRouter: () => ({push})}))

beforeEach(() => {
  add.mockReset()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function mockSearch() {
  const fetched = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      items: [{id: 'i1', name: 'Ajo', photoUrl: null, inPantry: false}],
      nextCursor: null,
    }),
  }))
  vi.stubGlobal('fetch', fetched)
  return fetched
}

function setup() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <AddToPantryForm />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

/** Picks Ajo out of the combobox and says how much there is. */
async function fillIn() {
  await userEvent.click(screen.getByRole('combobox', {name: m.ingredient}))
  await userEvent.click(await screen.findByRole('option', {name: /Ajo/}))
  await userEvent.type(screen.getByLabelText(m.quantity), '2')
  await userEvent.selectOptions(screen.getByLabelText(m.unit), 'g')
}

describe('AddToPantryForm', () => {
  /**
   * The picker marks what is already in the pantry out of the same cache it
   * searches from. Left alone, it goes on offering the ingredient just added
   * as though it were not there.
   *
   * Reopened rather than asserted straight after the add: the list is closed
   * by then, so invalidating marks it stale and the refetch comes when it is
   * next looked at — which is the moment the answer is read.
   */
  it('asks the picker again once something is added', async () => {
    add.mockResolvedValue({added: 'Ajo'})
    const fetched = mockSearch()
    setup()

    await fillIn()
    await waitFor(() => expect(fetched).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', {name: m.addOne}))
    await waitFor(() => expect(add).toHaveBeenCalled())
    fetched.mockClear()

    await userEvent.click(screen.getByRole('combobox', {name: m.ingredient}))
    await waitFor(() => expect(fetched).toHaveBeenCalled())
  })

  it('leaves the cache alone when nothing was added', async () => {
    add.mockResolvedValue({error: 'alreadyThere'})
    const fetched = mockSearch()
    setup()

    await fillIn()
    await waitFor(() => expect(fetched).toHaveBeenCalled())
    fetched.mockClear()

    await userEvent.click(screen.getByRole('button', {name: m.addOne}))

    expect(await screen.findByText(m.alreadyThere)).toBeInTheDocument()
    expect(fetched).not.toHaveBeenCalled()
  })
})
