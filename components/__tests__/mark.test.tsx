import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Mark} from '../mark'

describe('Mark', () => {
  it('exposes the label to assistive tech', () => {
    render(<Mark label="Recetario Mágico" />)
    expect(
      screen.getByRole('img', {name: 'Recetario Mágico'}),
    ).toBeInTheDocument()
  })

  it('scales without distorting', () => {
    render(<Mark size={24} label="Test" />)
    const svg = screen.getByRole('img', {name: 'Test'})
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
    expect(svg).toHaveAttribute('viewBox', '0 0 64 64')
  })
})
