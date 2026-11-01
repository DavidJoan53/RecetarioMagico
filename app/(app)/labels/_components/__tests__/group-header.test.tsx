import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {GroupWithLabels} from '@/lib/labels'
import messages from '@/messages/es.json'
import {GroupHeader} from '../group-header'

const update = vi.fn()
const remove = vi.fn()
vi.mock('../../actions', () => ({
  updateLabelGroupAction: (...a: unknown[]) => update(...a),
  deleteLabelGroupAction: (...a: unknown[]) => remove(...a),
}))

const m = messages.labels

const momento = (labels: {recipeCount: number}[]): GroupWithLabels => ({
  id: 'g1',
  name: 'Momento',
  labels: labels.map((l, i) => ({
    id: `l${i}`,
    name: `L${i}`,
    color: '#118ab2',
    labelGroupId: 'g1',
    recipeCount: l.recipeCount,
  })),
})

const setup = (labels: {recipeCount: number}[] = []) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <GroupHeader group={momento(labels)} headingId="h" />
    </NextIntlClientProvider>,
  )

const editButton = () =>
  screen.getByRole('button', {name: 'Editar grupo Momento'})
const deleteButton = () =>
  screen.getByRole('button', {name: 'Eliminar grupo Momento'})

beforeEach(() => {
  update.mockReset()
  remove.mockReset()
  update.mockResolvedValue({done: true})
  remove.mockResolvedValue({done: true})
})

describe('GroupHeader', () => {
  it('names both controls after the group', () => {
    setup()
    expect(editButton()).toBeInTheDocument()
    expect(deleteButton()).toBeInTheDocument()
  })

  it('renames from the current name and sends the id', async () => {
    setup()
    await userEvent.click(editButton())
    expect(screen.getByRole('textbox', {name: m.groupName})).toHaveValue(
      'Momento',
    )
    await userEvent.click(screen.getByRole('button', {name: m.save}))
    const form = update.mock.calls[0]?.[1] as FormData
    expect(form.get('id')).toBe('g1')
  })

  it('returns focus to the control that was used', async () => {
    setup()
    await userEvent.click(deleteButton())
    await userEvent.click(screen.getByRole('button', {name: m.cancel}))
    expect(deleteButton()).toHaveFocus()
    expect(editButton()).not.toHaveFocus()
  })

  describe('deleting a group', () => {
    /** Two cascades: into its labels, and from each label into its recipes. */
    it('counts the labels and the recipes they are on', async () => {
      setup([{recipeCount: 2}, {recipeCount: 3}])
      await userEvent.click(deleteButton())
      const warning = screen.getByText(/etiquetas/)
      expect(warning).toHaveTextContent('2 etiquetas')
      expect(warning).toHaveTextContent('5 recetas')
    })

    it('says when the group is empty', async () => {
      setup()
      await userEvent.click(deleteButton())
      expect(screen.getByText(m.groupHasNoLabels)).toBeInTheDocument()
    })

    it('asks before doing it', async () => {
      setup([{recipeCount: 1}])
      await userEvent.click(deleteButton())
      expect(
        screen.getByText('¿Eliminar el grupo Momento?'),
      ).toBeInTheDocument()
      expect(remove).not.toHaveBeenCalled()
    })
  })
})
