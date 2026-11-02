import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {timeZone} from '@/i18n/time-zone'
import type {DinnerListItem} from '@/lib/dinners'
import messages from '@/messages/es.json'
import {DinnerRow} from '../dinner-row'

const update = vi.hoisted(() => vi.fn())
const remove = vi.hoisted(() => vi.fn())
vi.mock('../../actions', () => ({
  updateDinnerAction: update,
  deleteDinnerAction: remove,
}))

const m = messages.dinners

/** 20:00 in America/Bogota, so the wall clock the form shows is predictable. */
const DINNER: DinnerListItem = {
  id: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  eatenAt: '2026-11-02T01:00:00.000Z',
  notes: 'Rico',
  recipes: [{id: 'r1', name: 'Arepa', imageUrl: null}],
}

/** However this locale renders it — the row names its buttons after it. */
const date = new Intl.DateTimeFormat('es', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone,
}).format(new Date(DINNER.eatenAt))

const named = (key: 'editLabel' | 'deleteLabel') =>
  m[key].replace('{date}', date)

const setup = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone={timeZone}>
      <QueryClientProvider client={new QueryClient()}>
        <ul>
          <DinnerRow dinner={DINNER} />
        </ul>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )

const editButton = () => screen.getByRole('button', {name: named('editLabel')})
const deleteButton = () =>
  screen.getByRole('button', {name: named('deleteLabel')})

beforeEach(() => {
  update.mockReset()
  remove.mockReset()
  update.mockResolvedValue({done: true})
  remove.mockResolvedValue({})
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
      json: async () => ({items: [], nextCursor: null}),
    })),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('DinnerRow', () => {
  it('shows what was eaten and when', () => {
    setup()
    expect(screen.getByText('Arepa')).toBeInTheDocument()
    expect(screen.getByText('Rico')).toBeInTheDocument()
  })

  /** The words are a locale's rendering; the attribute is the instant. */
  it('carries the instant as well as the words', () => {
    setup()
    expect(screen.getByText(date)).toHaveAttribute('datetime', DINNER.eatenAt)
  })

  /** A column of buttons all reading "Editar" says nothing about which row. */
  it('names its controls after the dinner they act on', () => {
    setup()
    expect(editButton()).toBeInTheDocument()
    expect(deleteButton()).toBeInTheDocument()
  })

  it('shows no form until asked', () => {
    setup()
    expect(screen.queryByRole('form')).toBeNull()
  })

  describe('when editing', () => {
    const open = async () => {
      setup()
      await userEvent.click(editButton())
    }

    it('opens a form named after the dinner', async () => {
      await open()
      expect(
        screen.getByRole('form', {name: m.editTitle.replace('{date}', date)}),
      ).toBeInTheDocument()
    })

    /** Otherwise the row changes shape and focus is left behind on nothing. */
    it('moves focus into the form', async () => {
      await open()
      expect(screen.getByLabelText(m.when)).toHaveFocus()
    })

    /** The create form, filled in — not an empty one. */
    it('starts from the dinner as it stands', async () => {
      await open()
      expect(screen.getByLabelText(m.when)).toHaveValue('2026-11-01T20:00')
      expect(screen.getByLabelText(m.notes)).toHaveValue('Rico')
      expect(
        screen.getByRole('button', {
          name: m.removeRecipe.replace('{name}', 'Arepa'),
        }),
      ).toBeInTheDocument()
    })

    it('sends the id, so the action knows what it is updating', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.get('id')).toBe(DINNER.id)
    })

    /** The instant, not the wall clock: the server cannot guess the zone. */
    it('sends the time with its offset on it', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.get('eatenAt')).toBe(DINNER.eatenAt)
    })

    it('sends every recipe still on the dinner', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.getAll('recipeIds')).toEqual(['r1'])
    })

    it('drops a recipe that was taken off', async () => {
      await open()
      await userEvent.click(
        screen.getByRole('button', {
          name: m.removeRecipe.replace('{name}', 'Arepa'),
        }),
      )
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      const form = update.mock.calls[0]?.[1] as FormData
      expect(form.getAll('recipeIds')).toEqual([])
    })

    it('returns focus to the edit button on cancel', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.cancel}))
      expect(editButton()).toHaveFocus()
    })

    /**
     * Waited for, not asserted straight after: the row goes back to a view
     * the moment the action resolves, but the focus that follows it is a
     * passive effect and has not run by then.
     */
    it('closes and returns focus once the change is saved', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))
      await waitFor(() => expect(editButton()).toHaveFocus())
    })

    it('stays open and says why when a recipe has gone', async () => {
      update.mockResolvedValue({error: 'recipeGone'})
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.save}))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(m.recipeGone)
      expect(
        screen.getByLabelText(m.when).getAttribute('aria-describedby'),
      ).toBe(alert.id)
    })
  })

  describe('when deleting', () => {
    const open = async () => {
      setup()
      await userEvent.click(deleteButton())
    }

    it('asks before doing it', async () => {
      await open()
      expect(
        screen.getByText(m.confirmDelete.replace('{date}', date)),
      ).toBeInTheDocument()
      expect(remove).not.toHaveBeenCalled()
    })

    /** The row lists recipes, so deleting it looks like it might take them. */
    it('says the recipes are not going anywhere', async () => {
      await open()
      expect(screen.getByText(m.keepsRecipes)).toBeInTheDocument()
    })

    /** The row has two ways back; each has to return to the one you used. */
    it('returns focus to the delete button, not the edit one', async () => {
      await open()
      await userEvent.click(screen.getByRole('button', {name: m.cancel}))
      expect(deleteButton()).toHaveFocus()
      expect(editButton()).not.toHaveFocus()
    })

    it('sends the id once confirmed', async () => {
      await open()
      await userEvent.click(
        screen.getByRole('button', {name: m.confirmDeleteAction}),
      )
      const form = remove.mock.calls[0]?.[1] as FormData
      expect(form.get('id')).toBe(DINNER.id)
    })
  })
})
