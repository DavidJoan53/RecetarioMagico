import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import {AddLabel} from '../add-label'

vi.mock('../../actions', () => ({createLabelAction: vi.fn(async () => ({}))}))

const m = messages.labels

const setup = () =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AddLabel groupId="g1" groupName="Desayuno" />
    </NextIntlClientProvider>,
  )

const plus = () =>
  screen.getByRole('button', {name: m.addTo.replace('{group}', 'Desayuno')})

describe('AddLabel', () => {
  /** A form per group, open, buries the labels people came to read. */
  it('starts closed, with only a way to open it', () => {
    setup()
    expect(plus()).toBeInTheDocument()
    expect(screen.queryByRole('textbox', {name: m.name})).toBeNull()
  })

  /** Named after its group: a column of pluses is otherwise all the same. */
  it('names the plus after the group it adds to', () => {
    setup()
    expect(plus()).toBeInTheDocument()
  })

  it('opens the form and puts the cursor in it', async () => {
    setup()
    await userEvent.click(plus())
    expect(screen.getByRole('textbox', {name: m.name})).toHaveFocus()
  })

  /**
   * The plus is gone while the form is open, so closing has to put focus
   * back deliberately — otherwise it falls to the body and the page loses
   * its place halfway down a list of groups.
   */
  it('closes back to the plus, with focus on it', async () => {
    setup()
    await userEvent.click(plus())
    await userEvent.click(screen.getByRole('button', {name: m.cancel}))

    expect(screen.queryByRole('textbox', {name: m.name})).toBeNull()
    expect(plus()).toHaveFocus()
  })
})
