import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {AddIngredient} from '../add-ingredient'

const m = messages.ingredients

const setup = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        <AddIngredient title="Ingredientes" action={vi.fn(async () => ({}))} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )

const plus = () => screen.getByRole('button', {name: m.addTitle})
const nameField = () => screen.queryByRole('textbox', {name: m.name})

describe('AddIngredient', () => {
  /** The list is what the page is for; the form is what you came to do once. */
  it('starts closed, with the heading and a plus', () => {
    setup()
    expect(
      screen.getByRole('heading', {level: 1, name: 'Ingredientes'}),
    ).toBeInTheDocument()
    expect(plus()).toBeInTheDocument()
    expect(nameField()).toBeNull()
  })

  it('opens the form and puts the cursor in it', async () => {
    setup()
    await userEvent.click(plus())
    expect(nameField()).toHaveFocus()
  })

  /** The plus is gone while the form is open, so focus has to come back. */
  it('closes back to the plus, with focus on it', async () => {
    setup()
    await userEvent.click(plus())
    await userEvent.click(screen.getByRole('button', {name: m.cancel}))

    expect(nameField()).toBeNull()
    expect(plus()).toHaveFocus()
  })

  /** Two ways to submit the page would be two things called "Añadir". */
  it('takes the plus out of the header while the form is open', async () => {
    setup()
    await userEvent.click(plus())
    /* The form carries the same name, so this asks for the button
       specifically rather than anything called "Añadir ingrediente". */
    expect(screen.queryAllByRole('button', {name: m.addTitle})).toHaveLength(0)
    expect(screen.getByRole('form', {name: m.addTitle})).toBeInTheDocument()
  })
})
