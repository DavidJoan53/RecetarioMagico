import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it} from 'vitest'
import type {GroupWithLabels} from '@/lib/labels'
import messages from '@/messages/es.json'
import {RecipeLabelFields} from '../recipe-label-fields'

const m = messages.recipeForm

const label = (id: string, name: string, groupId = 'g1') => ({
  id,
  name,
  color: '#118ab2',
  labelGroupId: groupId,
  recipeCount: 0,
})

const MOMENT: GroupWithLabels = {
  id: 'g1',
  name: 'Momento',
  labels: [label('l1', 'Cena'), label('l2', 'Desayuno')],
}

const EMPTY: GroupWithLabels = {id: 'g2', name: 'Herramienta', labels: []}

const setup = (groups: GroupWithLabels[], initial: {id: string}[] = []) => {
  const {container} = render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <form>
        <RecipeLabelFields
          groups={groups}
          initial={initial.map(l => label(l.id, l.id))}
        />
      </form>
    </NextIntlClientProvider>,
  )
  const form = container.querySelector('form')
  if (!form) throw new Error('no form rendered')
  return {submitted: () => new FormData(form).getAll('labelId')}
}

describe('RecipeLabelFields', () => {
  it('names each box after its label and groups them by group', () => {
    setup([MOMENT])
    expect(screen.getByRole('group', {name: m.labels})).toBeInTheDocument()
    expect(screen.getByRole('group', {name: 'Momento'})).toBeInTheDocument()
    expect(screen.getByRole('checkbox', {name: 'Cena'})).toBeInTheDocument()
    expect(screen.getByRole('checkbox', {name: 'Desayuno'})).toBeInTheDocument()
  })

  it('starts with the labels the recipe carries ticked, and no others', () => {
    setup([MOMENT], [{id: 'l2'}])
    expect(screen.getByRole('checkbox', {name: 'Cena'})).not.toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Desayuno'})).toBeChecked()
  })

  it('starts with nothing ticked when the recipe is new', () => {
    setup([MOMENT])
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeChecked()
    }
  })

  /** One `labelId` per tick is what the action reads with getAll. */
  it('submits an id for each ticked box and nothing for the rest', async () => {
    const {submitted} = setup([MOMENT])
    expect(submitted()).toEqual([])

    await userEvent.click(screen.getByRole('checkbox', {name: 'Cena'}))
    expect(submitted()).toEqual(['l1'])

    await userEvent.click(screen.getByRole('checkbox', {name: 'Desayuno'}))
    expect(submitted()).toEqual(['l1', 'l2'])

    await userEvent.click(screen.getByRole('checkbox', {name: 'Cena'}))
    expect(submitted()).toEqual(['l2'])
  })

  /** A heading over nothing reads as a label that failed to arrive. */
  it('leaves out a group that has no labels', () => {
    setup([MOMENT, EMPTY])
    expect(screen.queryByRole('group', {name: 'Herramienta'})).toBeNull()
  })

  it('points at the labels page when there is nothing to tick', () => {
    setup([EMPTY])
    expect(screen.getByRole('link', {name: m.goToLabels})).toHaveAttribute(
      'href',
      '/labels',
    )
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })
})
