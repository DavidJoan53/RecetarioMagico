import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {FieldList} from '../field-list'

const setup = () =>
  render(
    <FieldList
      name="instructions"
      legend="Preparación"
      itemLabel={n => `Paso ${n}`}
      removeLabel={n => `Quitar paso ${n}`}
      addLabel="Añadir paso"
    />,
  )

describe('FieldList', () => {
  it('starts with one labelled row and no way to remove it', () => {
    setup()
    expect(screen.getByRole('textbox', {name: 'Paso 1'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /Quitar/})).toBeNull()
  })

  it('adds rows, each labelled in order', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    expect(screen.getByRole('textbox', {name: 'Paso 3'})).toBeInTheDocument()
  })

  it('every row shares the field name so getAll returns them in order', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    for (const input of screen.getAllByRole('textbox')) {
      expect(input).toHaveAttribute('name', 'instructions')
    }
  })

  /** Keyed by counter, not index — reusing indexes misplaces the values. */
  it('removes the row that was asked for, not the one at that position', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))

    await userEvent.type(screen.getByRole('textbox', {name: 'Paso 1'}), 'first')
    await userEvent.type(
      screen.getByRole('textbox', {name: 'Paso 2'}),
      'second',
    )
    await userEvent.type(screen.getByRole('textbox', {name: 'Paso 3'}), 'third')

    await userEvent.click(screen.getByRole('button', {name: 'Quitar paso 2'}))

    const values = screen
      .getAllByRole('textbox')
      .map(i => (i as HTMLInputElement).value)
    expect(values).toEqual(['first', 'third'])
  })

  it('hides the remove control again when one row is left', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    await userEvent.click(screen.getByRole('button', {name: 'Quitar paso 2'}))
    expect(screen.queryByRole('button', {name: /Quitar/})).toBeNull()
  })
})
