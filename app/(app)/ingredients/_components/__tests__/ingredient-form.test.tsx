import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import messages from '@/messages/es.json'
import type {FormState} from '../../actions'
import {IngredientForm} from '../ingredient-form'

const m = messages.ingredients

const setup = (state: FormState = {}) => {
  const action = vi.fn(async () => state)
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <IngredientForm action={action} />
    </NextIntlClientProvider>,
  )
  const name = screen.getByRole('textbox', {name: m.name})
  return {action, name}
}

/** State only exists once the action has run, so these submit first. */
const submit = async (state: FormState) => {
  const {name} = setup(state)
  await userEvent.type(name, 'Tomate')
  await userEvent.click(screen.getByRole('button', {name: `+ ${m.add}`}))
  return name
}

describe('IngredientForm', () => {
  it('labels both fields and names the form', () => {
    const {name} = setup()
    expect(name).toBeRequired()
    expect(screen.getByRole('textbox', {name: m.photoUrl})).toBeInTheDocument()
    expect(screen.getByRole('form', {name: m.addTitle})).toBeInTheDocument()
  })

  it('submits to the action given to it', async () => {
    const {action} = setup()
    await userEvent.type(screen.getByRole('textbox', {name: m.name}), 'Tomate')
    await userEvent.click(screen.getByRole('button', {name: `+ ${m.add}`}))
    expect(action).toHaveBeenCalled()
  })

  it('says nothing before anything has happened', () => {
    setup()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  describe('when the ingredient is added', () => {
    /**
     * Focus returns to the name field so the next one is typed straight in —
     * which means the outcome is off-screen and has to be announced. status
     * waits for a pause rather than interrupting, which an alert would.
     */
    it('announces the result without interrupting', async () => {
      await submit({done: true})
      expect(await screen.findByRole('status')).toHaveTextContent(m.added)
    })

    it('clears the form and returns focus, ready for the next one', async () => {
      const name = await submit({done: true})
      expect(name).toHaveValue('')
      expect(name).toHaveFocus()
    })
  })

  describe('when it is refused', () => {
    it('announces a duplicate name', async () => {
      await submit({error: 'duplicateName'})
      expect(await screen.findByRole('alert')).toHaveTextContent(m.duplicate)
    })

    it('ties the message to the field it is about', async () => {
      const name = await submit({error: 'duplicateName'})
      const alert = await screen.findByRole('alert')
      expect(name).toHaveAttribute('aria-invalid', 'true')
      expect(name.getAttribute('aria-describedby')).toBe(alert.id)
    })

    /** Losing what you typed to an error is the worst case; keep it. */
    it('keeps what was typed', async () => {
      const name = await submit({error: 'duplicateName'})
      expect(name).toHaveValue('Tomate')
    })
  })
})
