import {describe, expect, it} from 'vitest'
import {cursorFrom, PAGE_SIZE, pageOf} from '../validation/page'

const from = (query: string) => cursorFrom(new URLSearchParams(query))

describe('cursorFrom', () => {
  it('reads no parameter as the first page', () => {
    const parsed = from('')
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual({after: null})
  })

  it('takes a cursor', () => {
    expect(from('after=Ajo').data).toEqual({after: 'Ajo'})
  })

  /** A blank cursor is the beginning, not a row whose cursor is empty. */
  it('reads a blank cursor as the beginning', () => {
    expect(from('after=').data?.after).toBeNull()
  })

  it('trims a cursor', () => {
    expect(from('after=%20Ajo%20').data?.after).toBe('Ajo')
  })
})

describe('pageOf', () => {
  const row = (name: string) => ({name})
  const named = (r: {name: string}) => r.name

  it('keeps the extra row out of the page and points at the last shown', () => {
    const rows = ['a', 'b', 'c'].map(row)
    expect(pageOf(rows, 2, named)).toEqual({
      items: [row('a'), row('b')],
      nextCursor: 'b',
    })
  })

  /** Exactly a full page with nothing behind it is the end, not a next page. */
  it('has no cursor when the rows stop at the limit', () => {
    const rows = ['a', 'b'].map(row)
    expect(pageOf(rows, 2, named)).toEqual({items: rows, nextCursor: null})
  })

  it('has no cursor when there is nothing at all', () => {
    expect(pageOf([], PAGE_SIZE, named)).toEqual({items: [], nextCursor: null})
  })
})
