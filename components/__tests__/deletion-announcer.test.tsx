import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {DeletionAnnouncer, useAnnounceDeletion} from '../deletion-announcer'

function Shout({text}: {text: string}) {
  const announce = useAnnounceDeletion()
  return (
    <button type="button" onClick={() => announce(text)}>
      go
    </button>
  )
}

describe('DeletionAnnouncer', () => {
  it('says nothing until something goes', () => {
    render(
      <DeletionAnnouncer>
        <Shout text="Cena eliminada" />
      </DeletionAnnouncer>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('announces what went', async () => {
    render(
      <DeletionAnnouncer>
        <Shout text="Cena eliminada" />
      </DeletionAnnouncer>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'go'}))
    expect(screen.getByRole('status')).toHaveTextContent('Cena eliminada')
  })

  /**
   * The row that held focus is unmounting, so focus has to land somewhere
   * deliberate or it falls to the body and the page loses its place.
   */
  it('catches focus on the list', async () => {
    const {container} = render(
      <DeletionAnnouncer>
        <Shout text="Cena eliminada" />
      </DeletionAnnouncer>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'go'}))
    expect(container.querySelector('[tabindex="-1"]')).toHaveFocus()
  })

  /** Used outside a provider in tests and in isolation; it must not throw. */
  it('does nothing rather than crashing with no provider', async () => {
    render(<Shout text="ignored" />)
    await userEvent.click(screen.getByRole('button', {name: 'go'}))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
