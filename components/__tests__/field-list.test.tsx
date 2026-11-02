import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {FieldList} from '../field-list'

const setup = (initialValues?: string[]) =>
  render(
    <FieldList
      name="instructions"
      legend="Preparación"
      itemLabel={n => `Paso ${n}`}
      removeLabel={n => `Quitar paso ${n}`}
      addLabel="Añadir paso"
      initialValues={initialValues}
    />,
  )

/** The same list, told to show its positions. */
const numbered = (initialValues: string[]) =>
  render(
    <FieldList
      name="instructions"
      legend="Preparación"
      itemLabel={n => `Paso ${n}`}
      removeLabel={n => `Quitar paso ${n}`}
      addLabel="Añadir paso"
      initialValues={initialValues}
      numbered
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

  describe('when an existing recipe is being edited', () => {
    it('starts with a row per value, already filled in', () => {
      setup(['Amasar', 'Freír'])
      expect(screen.getByRole('textbox', {name: 'Paso 1'})).toHaveValue(
        'Amasar',
      )
      expect(screen.getByRole('textbox', {name: 'Paso 2'})).toHaveValue('Freír')
    })

    /** A legend with no input under it is a field that cannot be filled. */
    it('still offers one empty row when there is nothing to edit', () => {
      setup([])
      expect(screen.getByRole('textbox', {name: 'Paso 1'})).toHaveValue('')
    })

    /** Keyed past the seeded rows, or an added row reuses a key in use. */
    it('adds a row after the ones it started with', async () => {
      setup(['Amasar', 'Freír'])
      await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
      await userEvent.type(
        screen.getByRole('textbox', {name: 'Paso 3'}),
        'Servir',
      )

      const values = screen
        .getAllByRole('textbox')
        .map(i => (i as HTMLInputElement).value)
      expect(values).toEqual(['Amasar', 'Freír', 'Servir'])
    })
  })

  it('hides the remove control again when one row is left', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', {name: /Añadir paso/}))
    await userEvent.click(screen.getByRole('button', {name: 'Quitar paso 2'}))
    expect(screen.queryByRole('button', {name: /Quitar/})).toBeNull()
  })

  /**
   * The steps of a recipe are a sequence, and a column of identical inputs
   * gives no sign of which one is being edited. The detail page numbers them;
   * the form that writes them did not.
   */
  describe('when numbered', () => {
    it('shows each row its position', () => {
      numbered(['uno', 'dos'])
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    /** The input is already called "Paso 1"; the digit would be a second one. */
    it('hides the digit from the accessible name', () => {
      const {container} = numbered(['uno'])
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
        '1',
      )
      expect(screen.getByRole('textbox', {name: 'Paso 1'})).toBeInTheDocument()
    })

    it('renumbers what is left when a row is removed', async () => {
      numbered(['uno', 'dos', 'tres'])
      await userEvent.click(screen.getByRole('button', {name: 'Quitar paso 1'}))
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.queryByText('3')).toBeNull()
    })
  })

  /** Links read as themselves; a digit beside one is noise. */
  it('shows no numbers unless asked', () => {
    setup(['uno', 'dos'])
    expect(screen.queryByText('1')).toBeNull()
  })
})
