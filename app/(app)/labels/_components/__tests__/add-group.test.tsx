import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {AddGroup} from '../add-group'

vi.mock('../../actions', () => ({
  createLabelGroupAction: vi.fn(async () => ({})),
}))

const m = messages.labels

const setup = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AddGroup title="Etiquetas" />
    </NextIntlClientProvider>,
  )

const plus = () => screen.getByRole('button', {name: m.newGroup})
const nameField = () => screen.queryByRole('textbox', {name: m.newGroup})

describe('AddGroup', () => {
  /** The groups are what the page is for; the form is a thing you came to
      do once. */
  it('starts closed, with the heading and a plus', () => {
    setup()
    expect(
      screen.getByRole('heading', {level: 1, name: 'Etiquetas'}),
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

  /** Two ways to open the page's one form would be two identical plusses. */
  it('takes the plus out of the header while the form is open', async () => {
    setup()
    await userEvent.click(plus())
    /* The form carries the same name, so this asks for the button
       specifically rather than anything called "Nuevo grupo". */
    expect(screen.queryAllByRole('button', {name: m.newGroup})).toHaveLength(0)
    expect(screen.getByRole('form', {name: m.newGroup})).toBeInTheDocument()
  })
})
