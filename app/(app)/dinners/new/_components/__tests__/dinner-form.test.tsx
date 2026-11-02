import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {timeZone} from '@/i18n/time-zone'
import messages from '@/messages/es.json'
import {DinnerForm} from '../dinner-form'

const m = messages.dinners

const AREPA = {
  id: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  name: 'Arepa',
  prepTimeMinutes: null,
  instructions: [],
  links: [],
  imageUrl: null,
  createdAt: '2026-10-30T20:00:00.000Z',
}

const action = vi.fn()

beforeEach(() => {
  action.mockReset()
  action.mockResolvedValue({done: true})
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({items: [AREPA], nextCursor: null}),
    })),
  )
})
afterEach(() => vi.unstubAllGlobals())

function setup() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone={timeZone}>
      <QueryClientProvider client={client}>
        <DinnerForm action={action} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

const when = () => screen.getByLabelText(m.when)

/** Picks Arepa out of the combobox and says when the dinner was. */
async function fillIn() {
  await userEvent.clear(when())
  await userEvent.type(when(), '2026-11-01T20:00')
  await userEvent.click(screen.getByRole('combobox', {name: m.recipes}))
  await userEvent.click(await screen.findByRole('option', {name: /Arepa/}))
}

const submit = () =>
  userEvent.click(screen.getByRole('button', {name: `+ ${m.add}`}))

describe('DinnerForm', () => {
  /** The server and the browser do not reach `new Date()` at the same tick. */
  it('fills in now once it is on screen', async () => {
    setup()
    await waitFor(() => expect(when()).not.toHaveValue(''))
  })

  /* The instant sent rather than the wall clock typed, and the recipes that
     went with it, are proven in e2e/dinners.spec.ts — "shows and edits one
     dinner in the house clock" — against a real database and a real zone.
     Checked here it would assert fromDateTimeLocal against itself. */

  /** The pair is a primary key, so the same recipe twice is a failed write. */
  it('refuses to add the same recipe twice', async () => {
    setup()
    await fillIn()
    await userEvent.click(screen.getByRole('combobox', {name: m.recipes}))
    await userEvent.click(await screen.findByRole('option', {name: /Arepa/}))

    expect(
      screen.getAllByRole('button', {
        name: m.removeRecipe.replace('{name}', 'Arepa'),
      }),
    ).toHaveLength(1)
  })

  it('takes a recipe back off', async () => {
    setup()
    await fillIn()
    await userEvent.click(
      screen.getByRole('button', {
        name: m.removeRecipe.replace('{name}', 'Arepa'),
      }),
    )
    expect(screen.getByText(m.noneChosen)).toBeInTheDocument()
  })

  it('clears itself for the next dinner once one is logged', async () => {
    setup()
    await fillIn()
    await userEvent.type(screen.getByLabelText(m.notes), 'Rico')
    await submit()

    await waitFor(() => expect(screen.getByLabelText(m.notes)).toHaveValue(''))
    expect(screen.getByText(m.noneChosen)).toBeInTheDocument()
    expect(when()).toHaveFocus()
  })

  /**
   * React resets an uncontrolled form after an action whether it worked or
   * not, which would throw away everything picked on the way to a rejection.
   */
  it('keeps what was picked when the write is refused', async () => {
    /* The field error, which is the one that still has somewhere on the form
       to point. "recipeGone" names nothing here and goes to a toast. */
    action.mockResolvedValue({error: 'invalid'})
    setup()
    await fillIn()
    await userEvent.type(screen.getByLabelText(m.notes), 'Rico')
    await submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(m.invalid)
    expect(screen.getByLabelText(m.notes)).toHaveValue('Rico')
    expect(when()).toHaveValue('2026-11-01T20:00')
    expect(when().getAttribute('aria-describedby')).toBe(alert.id)
  })
})
