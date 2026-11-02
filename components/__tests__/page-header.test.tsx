import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {PageHeader} from '../page-header'

describe('PageHeader', () => {
  it('renders the title as the page heading', () => {
    render(<PageHeader title="Recetas" />)
    expect(
      screen.getByRole('heading', {level: 1, name: 'Recetas'}),
    ).toBeInTheDocument()
  })

  it('is a header, so the title and its controls are one group', () => {
    const {container} = render(<PageHeader title="Recetas" />)
    expect(container.querySelector('header')).toBeInTheDocument()
  })

  /**
   * Tab order follows the DOM, so the way back has to come before the
   * heading and the actions after it. Reading order and tab order then
   * agree with where the three things appear on screen.
   */
  it('puts the way back before the heading and the actions after it', () => {
    render(
      <PageHeader
        title="Nueva receta"
        leading={<button type="button">Cancelar</button>}
        actions={<button type="button">Guardar</button>}
      />,
    )
    const order = screen.getAllByRole('button').map(b => b.textContent)
    expect(order).toEqual(['Cancelar', 'Guardar'])

    const back = screen.getByRole('button', {name: 'Cancelar'})
    const heading = screen.getByRole('heading', {level: 1})
    expect(back.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  /** Most pages have one side or neither; the slots are optional. */
  it('renders with no controls at all', () => {
    render(<PageHeader title="Ajustes" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('takes actions without a way back', () => {
    render(
      <PageHeader
        title="Cenas"
        actions={<button type="button">Añadir</button>}
      />,
    )
    expect(screen.getByRole('button', {name: 'Añadir'})).toBeInTheDocument()
  })
})
