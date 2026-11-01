import {describe, expect, it} from 'vitest'
import type {Label, LabelGroup} from '@/db/schema'
import {groupByGroup} from '../labels'

const group = (id: string, name: string): LabelGroup => ({id, name})
const label = (id: string, name: string, groupId: string): Label => ({
  id,
  name,
  color: '#118ab2',
  labelGroupId: groupId,
})

const row = (g: LabelGroup, l: Label | null, recipeCount = 0) => ({
  group: g,
  label: l,
  recipeCount: l ? recipeCount : null,
})

describe('groupByGroup', () => {
  it('collects the labels a left join repeated per row', () => {
    const result = groupByGroup([
      row(group('g1', 'Momento'), label('l1', 'Cena', 'g1')),
      row(group('g1', 'Momento'), label('l2', 'Almuerzo', 'g1')),
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.labels.map(l => l.name)).toEqual(['Cena', 'Almuerzo'])
  })

  /** The state every group starts in, and the join gives a null row for it. */
  it('keeps a group that has no labels', () => {
    const result = groupByGroup([row(group('g1', 'Vacío'), null)])
    expect(result[0]?.labels).toEqual([])
  })

  it('keeps groups apart', () => {
    const result = groupByGroup([
      row(group('g1', 'Momento'), label('l1', 'Cena', 'g1')),
      row(group('g2', 'Herramienta'), label('l2', 'Horno', 'g2')),
    ])
    expect(result.map(g => g.name)).toEqual(['Momento', 'Herramienta'])
    expect(result[1]?.labels.map(l => l.name)).toEqual(['Horno'])
  })

  it('returns nothing for nothing', () => {
    expect(groupByGroup([])).toEqual([])
  })
  /** Deleting a label cascades, so the warning needs this number. */
  it('carries how many recipes use each label', () => {
    const result = groupByGroup([
      row(group('g1', 'Momento'), label('l1', 'Cena', 'g1'), 3),
    ])
    expect(result[0]?.labels[0]?.recipeCount).toBe(3)
  })

  it('reads a missing count as none', () => {
    const result = groupByGroup([
      {
        group: group('g1', 'M'),
        label: label('l1', 'Cena', 'g1'),
        recipeCount: null,
      },
    ])
    expect(result[0]?.labels[0]?.recipeCount).toBe(0)
  })
})
