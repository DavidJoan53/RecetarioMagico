import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {SectionSkeleton} from '../section-skeleton'

describe('SectionSkeleton', () => {
  /** A placeholder is noise to a screen reader; the real content follows. */
  it('is hidden from assistive technology', () => {
    const {container} = render(<SectionSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('reserves space so streaming in cannot shift the page', () => {
    const {container} = render(<SectionSkeleton />)
    expect(container.querySelectorAll('.h-16')).toHaveLength(2)
  })
})
