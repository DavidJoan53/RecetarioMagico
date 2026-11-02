import {describe, expect, it} from 'vitest'
import {recipeSearchFrom} from '../validation/recipe-search'

const params = (query: string) => new URLSearchParams(query)

describe('recipeSearchFrom', () => {
  /** An empty box is a valid search: the list and the picker are one call. */
  it('reads no parameters as the whole list from the start', () => {
    const parsed = recipeSearchFrom(params(''))
    expect(parsed.data).toEqual({query: '', after: null})
  })

  it('reads a name to narrow by', () => {
    expect(recipeSearchFrom(params('query=arepa')).data?.query).toBe('arepa')
  })

  it('trims what was typed', () => {
    expect(recipeSearchFrom(params('query=%20arepa%20')).data?.query).toBe(
      'arepa',
    )
  })

  it('reads the cursor to continue from', () => {
    expect(recipeSearchFrom(params('after=abc')).data?.after).toBe('abc')
  })

  /** Blank is the beginning, not a recipe whose id is the empty string. */
  it('treats a blank cursor as the beginning', () => {
    expect(recipeSearchFrom(params('after=')).data?.after).toBeNull()
  })

  it('refuses a name longer than the column takes', () => {
    expect(recipeSearchFrom(params(`query=${'a'.repeat(201)}`)).success).toBe(
      false,
    )
  })
})
