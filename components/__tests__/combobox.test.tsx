import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {Page} from '@/lib/validation/page'
import messages from '@/messages/es.json'
import {Combobox} from '../combobox'

/**
 * Nothing about ingredients here on purpose: the behaviour is covered by
 * ingredient-combobox.test.tsx, and what this pins down is that the component
 * works for something that is not one.
 */
type City = {code: string; city: string}

const cities: City[] = [
  {code: 'bog', city: 'Bogotá'},
  {code: 'mde', city: 'Medellín'},
]

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function setup(
  options: {items?: City[]; renderNote?: (city: City) => React.ReactNode} = {},
) {
  const items = options.items ?? cities
  const fetchPage = vi.fn(
    async (): Promise<Page<City>> => ({items, nextCursor: null}),
  )
  const onChange = vi.fn()
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <Combobox<City>
          label="Ciudad"
          placeholder="Busca una ciudad…"
          emptyMessage="Ninguna ciudad con ese nombre."
          value={null}
          onChange={onChange}
          queryKey={['cities']}
          fetchPage={fetchPage}
          getKey={city => city.code}
          getLabel={city => city.city}
          renderNote={options.renderNote}
        />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )

  return {
    onChange,
    fetchPage,
    input: screen.getByRole('combobox', {name: 'Ciudad'}),
  }
}

describe('Combobox', () => {
  it('names itself and its list from what it was given', async () => {
    const {input} = setup()
    await userEvent.click(input)
    expect(await screen.findByRole('option', {name: 'Bogotá'})).toBeVisible()
    expect(screen.getByRole('listbox', {name: 'Ciudad'})).toBeInTheDocument()
  })

  it('labels options with getLabel and keys them with getKey', async () => {
    const {input} = setup()
    await userEvent.click(input)
    const option = await screen.findByRole('option', {name: 'Medellín'})
    expect(option.id).toMatch(/-1$/)
  })

  it('hands back the whole item, not its label', async () => {
    const {input, onChange} = setup()
    await userEvent.click(input)
    await userEvent.click(await screen.findByRole('option', {name: 'Bogotá'}))
    expect(onChange).toHaveBeenCalledWith(cities[0])
    expect(input).toHaveValue('Bogotá')
  })

  it('puts a note after the name when one is given', async () => {
    const {input} = setup({
      renderNote: city => (city.code === 'bog' ? 'capital' : null),
    })
    await userEvent.click(input)
    await screen.findByRole('option', {name: /Bogotá/})
    expect(screen.getByText('capital')).toBeVisible()
    expect(screen.getByRole('option', {name: 'Medellín'})).toBeInTheDocument()
  })

  /**
   * Glued, these read as "Bogotácapital" — and the words on screen stop
   * matching the name they are read under.
   */
  it('reads the name and its note as separate words', async () => {
    const {input} = setup({
      renderNote: city => (city.code === 'bog' ? 'capital' : null),
    })
    await userEvent.click(input)
    expect(
      await screen.findByRole('option', {name: 'Bogotá capital'}),
    ).toBeInTheDocument()
  })

  it('says the caller’s words when nothing matched', async () => {
    const {input} = setup({items: []})
    await userEvent.click(input)
    expect(
      await screen.findByText('Ninguna ciudad con ese nombre.'),
    ).toBeInTheDocument()
  })

  /** Each search caches on its own, under the key the caller chose. */
  it('searches on what was typed', async () => {
    const {input, fetchPage} = setup()
    await userEvent.click(input)
    await screen.findByRole('option', {name: 'Bogotá'})

    await userEvent.type(input, 'med')
    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith('med', null))
  })
})
