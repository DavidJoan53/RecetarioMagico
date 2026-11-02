import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {FocusCatcher, useCatchFocus} from '../focus-catcher'

function Row() {
  const catchFocus = useCatchFocus()
  return (
    <button type="button" onClick={catchFocus}>
      go
    </button>
  )
}

describe('FocusCatcher', () => {
  /**
   * The row that held focus is unmounting, so focus has to land somewhere
   * deliberate or it falls to the body and the page loses its place. A toast
   * cannot do this job: it never takes focus, by design.
   */
  it('catches focus on the list', async () => {
    const {container} = render(
      <FocusCatcher>
        <Row />
      </FocusCatcher>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'go'}))
    expect(container.querySelector('[tabindex="-1"]')).toHaveFocus()
  })

  /** It says nothing. What happened is reported by a toast, not from here. */
  it('adds no live region of its own', () => {
    render(
      <FocusCatcher>
        <Row />
      </FocusCatcher>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  /** Used outside a provider in tests and in isolation; it must not throw. */
  it('does nothing rather than crashing with no provider', async () => {
    render(<Row />)
    const button = screen.getByRole('button', {name: 'go'})
    await userEvent.click(button)
    expect(button).toHaveFocus()
  })
})
