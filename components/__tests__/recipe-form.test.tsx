import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it, vi} from 'vitest'
import type {FormState} from '@/app/(app)/recipes/actions'
import messages from '@/messages/es.json'
import {RecipeForm} from '../recipe-form'

const setup = (state: FormState = {}) => {
  const action = vi.fn(async () => state)
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RecipeForm action={action} submitLabel={messages.recipeForm.create} />
    </NextIntlClientProvider>,
  )
  return {action}
}

describe('RecipeForm', () => {
  it('labels every control so it can be found by name', () => {
    setup()
    expect(
      screen.getByRole('textbox', {name: messages.recipeForm.name}),
    ).toBeRequired()
    expect(
      screen.getByRole('spinbutton', {name: messages.recipeForm.minutes}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {name: messages.recipeForm.instructions}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {name: messages.recipeForm.links}),
    ).toBeInTheDocument()
  })

  it('submits to the action given to it', async () => {
    const {action} = setup()
    await userEvent.type(
      screen.getByRole('textbox', {name: messages.recipeForm.name}),
      'Arepa',
    )
    await userEvent.click(
      screen.getByRole('button', {name: messages.recipeForm.create}),
    )
    expect(action).toHaveBeenCalled()
  })

  it('offers a way out that does not submit', () => {
    setup()
    expect(
      screen.getByRole('link', {name: messages.recipeForm.cancel}),
    ).toHaveAttribute('href', '/recipes')
  })

  describe('when the action reports a problem', () => {
    /** The state only exists after the action runs, so submit first. */
    const submit = async (state: FormState) => {
      setup(state)
      await userEvent.type(
        screen.getByRole('textbox', {name: messages.recipeForm.name}),
        'Arepa',
      )
      await userEvent.click(
        screen.getByRole('button', {name: messages.recipeForm.create}),
      )
      return screen.findByRole('alert')
    }

    /** An alert reaches a screen reader without the user going looking. */
    it('announces a duplicate name rather than only colouring it', async () => {
      const alert = await submit({error: 'duplicateName'})
      expect(alert).toHaveTextContent(messages.recipeForm.duplicateName)
    })

    it('announces a validation failure', async () => {
      const alert = await submit({error: 'invalid'})
      expect(alert).toHaveTextContent(messages.recipeForm.invalid)
    })

    it('ties the message to the field it is about', async () => {
      const alert = await submit({error: 'duplicateName'})
      const name = screen.getByRole('textbox', {name: messages.recipeForm.name})
      expect(name).toHaveAttribute('aria-invalid', 'true')
      expect(name.getAttribute('aria-describedby')).toBe(alert.id)
    })
  })

  it('shows no alert before anything has gone wrong', () => {
    setup()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  /** The labels are callbacks, so they only run once a row exists to name. */
  it('numbers added steps and links, and names their remove controls', async () => {
    setup()
    await userEvent.click(
      screen.getByRole('button', {name: `+ ${messages.recipeForm.addStep}`}),
    )
    await userEvent.click(
      screen.getByRole('button', {name: `+ ${messages.recipeForm.addLink}`}),
    )

    expect(screen.getByRole('textbox', {name: 'Paso 2'})).toBeInTheDocument()
    expect(screen.getByRole('textbox', {name: 'Enlace 2'})).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Quitar paso 2'}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Quitar enlace 2'}),
    ).toBeInTheDocument()
  })
})
