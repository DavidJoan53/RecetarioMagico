import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {EmptyState} from '../empty-state'

describe('EmptyState', () => {
  it('says what is empty', () => {
    render(<EmptyState title="Todavía no tienes recetas." />)
    expect(screen.getByText('Todavía no tienes recetas.')).toBeInTheDocument()
  })

  it('adds what to do about it when there is something to say', () => {
    render(
      <EmptyState
        title="Todavía no tienes recetas."
        hint="Crea la primera y aparecerá aquí."
      />,
    )
    expect(
      screen.getByText('Crea la primera y aparecerá aquí.'),
    ).toBeInTheDocument()
  })

  /** Most of these have a form on the same page and nowhere to send you. */
  it('renders without a hint or an action', () => {
    render(<EmptyState title="Tu despensa está vacía." />)
    expect(screen.getByText('Tu despensa está vacía.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('takes the way out as a slot, so the caller owns where it goes', () => {
    render(
      <EmptyState
        title="Tu despensa está vacía."
        action={<a href="/pantry/add">Añadir a la despensa</a>}
      />,
    )
    expect(
      screen.getByRole('link', {name: 'Añadir a la despensa'}),
    ).toHaveAttribute('href', '/pantry/add')
  })
})
