import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {Label} from '@/db/schema'
import {contrastRatio} from '@/lib/color'
import {LabelChip} from '../label-chip'

const label = (color: string): Label => ({
  id: 'l1',
  name: 'Cena',
  color,
  labelGroupId: 'g1',
})

/** jsdom resolves an inline colour to rgb(); contrastRatio reads hex. */
function toHex(rgb: string): string {
  const parts = rgb.match(/\d+/g)?.map(Number) ?? []
  return `#${parts.map(n => n.toString(16).padStart(2, '0')).join('')}`
}

describe('LabelChip', () => {
  it('shows the name', () => {
    render(<LabelChip label={label('#118ab2')} />)
    expect(screen.getByText('Cena')).toBeInTheDocument()
  })

  /**
   * The picker is free, so this is the guarantee that replaces restricting it:
   * whatever is chosen, the text on top is readable. Both extremes, and the
   * mid grey where the choice between black and white flips.
   */
  it.each(['#000000', '#ffffff', '#118ab2', '#ffd166', '#777777'])(
    'stays readable on %s',
    color => {
      render(<LabelChip label={label(color)} />)
      const chip = screen.getByText('Cena')
      expect(
        contrastRatio(color, toHex(chip.style.color)),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('paints the chip with the colour it was given', () => {
    render(<LabelChip label={label('#ffd166')} />)
    expect(toHex(screen.getByText('Cena').style.backgroundColor)).toBe(
      '#ffd166',
    )
  })
})
