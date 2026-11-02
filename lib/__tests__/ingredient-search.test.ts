import {describe, expect, it} from 'vitest'
import {ingredientSearchFrom} from '../validation/ingredient-search'

const from = (query: string) => ingredientSearchFrom(new URLSearchParams(query))

describe('ingredientSearchFrom', () => {
  /** An empty box is a search: it means everything, not nothing. */
  it('reads no parameters as an unfiltered first page', () => {
    const parsed = from('')
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual({query: '', after: null})
  })

  it('trims the query', () => {
    expect(from('query=%20ajo%20').data?.query).toBe('ajo')
  })

  it('takes a cursor', () => {
    expect(from('query=aj&after=Ajo').data).toEqual({query: 'aj', after: 'Ajo'})
  })

  /** A blank cursor is the first page, not a row whose name is empty. */
  it('reads a blank cursor as the beginning', () => {
    expect(from('after=').data?.after).toBeNull()
  })

  it('refuses a query longer than any name can be', () => {
    expect(from(`query=${'a'.repeat(121)}`).success).toBe(false)
  })
})
