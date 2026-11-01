import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {LabelWithUsage} from '@/lib/labels'
import messages from '@/messages/es.json'
import {LabelItem} from '../label-item'

const update = vi.fn()
const remove = vi.fn()
vi.mock('../../actions', () => ({
  updateLabelAction: (...a: unknown[]) => update(...a),
  deleteLabelAction: (...a: unknown[]) => remove(...a),
}))

const m = messages.labels

const cena = (recipeCount: number): LabelWithUsage => ({
  id: 'l1',
  name: 'Cena',
  color: '#118ab2',
  labelGroupId: 'g1',
  recipeCount,
})

const setup = (recipeCount = 0) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ul>
        <LabelItem label={cena(recipeCount)} />
      </ul>
    </NextIntlClientProvider>,
  )

const chip = () => screen.getByRole('button', {name: 'Editar Cena'})

beforeEach(() => {
  update.mockReset()
  remove.mockReset()
  update.mockResolvedValue({done: true})
  remove.mockResolvedValue({done: true})
})

describe('LabelItem', () => {
  it('names the chip after what pressing it does', () => {
    setup()
    expect(chip()).toBeInTheDocument()
  })

  it('opens an editor holding the current values', async () => {
    setup()
    await userEvent.click(chip())
    expect(screen.getByRole('textbox', {name: m.name})).toHaveValue('Cena')
    expect(screen.getByRole('textbox', {name: m.name})).toHaveFocus()
  })

  it('sends the id and the group it belongs to', async () => {
    setup()
    await userEvent.click(chip())
    await userEvent.click(screen.getByRole('button', {name: m.save}))
    const form = update.mock.calls[0]?.[1] as FormData
    expect(form.get('id')).toBe('l1')
    expect(form.get('labelGroupId')).toBe('g1')
  })

  it('returns focus to the chip on cancel', async () => {
    setup()
    await userEvent.click(chip())
    await userEvent.click(screen.getByRole('button', {name: m.cancel}))
    expect(chip()).toHaveFocus()
  })

  describe('deleting', () => {
    const openConfirm = async (recipeCount: number) => {
      setup(recipeCount)
      await userEvent.click(chip())
      await userEvent.click(screen.getByRole('button', {name: m.delete}))
    }

    it('asks first', async () => {
      await openConfirm(0)
      expect(screen.getByText('¿Eliminar Cena?')).toBeInTheDocument()
      expect(remove).not.toHaveBeenCalled()
    })

    /**
     * recipe_labels cascades, so nothing refuses — the count has to be on
     * screen before agreeing rather than in an apology afterwards.
     */
    it('warns how many recipes lose it', async () => {
      await openConfirm(3)
      expect(screen.getByText(/3 recetas/)).toBeInTheDocument()
    })

    it('says so when no recipe uses it', async () => {
      await openConfirm(0)
      expect(screen.getByText(m.usedByNothing)).toBeInTheDocument()
    })

    it('opens with focus on the way out', async () => {
      await openConfirm(1)
      expect(screen.getByRole('button', {name: m.cancel})).toHaveFocus()
    })
  })
})
