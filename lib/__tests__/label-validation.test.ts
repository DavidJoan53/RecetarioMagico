import {describe, expect, it} from 'vitest'
import {
  labelGroupInputFromForm,
  labelInput,
  labelInputFromForm,
} from '../validation/label'

const GROUP = '0199c0de-1234-7abc-8def-0123456789ab'

const form = (entries: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(entries)) data.append(k, v)
  return data
}

const valid = {name: 'Cena', color: '#118AB2', labelGroupId: GROUP}

describe('labelInput', () => {
  it('trims the name', () => {
    expect(labelInput.parse({...valid, name: '  Cena '}).name).toBe('Cena')
  })

  /** Stored lowercase so two spellings of one colour are one value. */
  it('lowercases the colour', () => {
    expect(labelInput.parse(valid).color).toBe('#118ab2')
  })

  it('rejects a name that is only whitespace', () => {
    expect(labelInput.safeParse({...valid, name: '  '}).success).toBe(false)
  })

  /** lib/color parses six digits; anything else would render as nothing. */
  it.each(['#fff', 'red', '118ab2', '#1188zz', '#118ab2ff', ''])(
    'rejects %s as a colour',
    color => {
      expect(labelInput.safeParse({...valid, color}).success).toBe(false)
    },
  )

  it('rejects a group that is not an id', () => {
    expect(labelInput.safeParse({...valid, labelGroupId: 'g1'}).success).toBe(
      false,
    )
  })
})

describe('reading a form', () => {
  it('takes a whole label from the fields', () => {
    const parsed = labelInputFromForm(
      form({name: 'Horno', color: '#81b29a', labelGroupId: GROUP}),
    )
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual({
      name: 'Horno',
      color: '#81b29a',
      labelGroupId: GROUP,
    })
  })

  /** The field is hidden, so a missing one means the markup broke. */
  it('fails when the group is absent', () => {
    expect(
      labelInputFromForm(form({name: 'Horno', color: '#81b29a'})).success,
    ).toBe(false)
  })

  it('takes a group name on its own', () => {
    const parsed = labelGroupInputFromForm(form({name: '  Momento '}))
    expect(parsed.data).toEqual({name: 'Momento'})
  })

  /** Absent is not blank: FormData.get returns null, and Zod needs a string. */
  it('fails on a form with no fields at all', () => {
    expect(labelInputFromForm(new FormData()).success).toBe(false)
    expect(labelGroupInputFromForm(new FormData()).success).toBe(false)
  })

  it('fails on a blank group name', () => {
    expect(labelGroupInputFromForm(form({name: ''})).success).toBe(false)
  })
})
