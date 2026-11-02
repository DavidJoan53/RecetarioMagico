import {render, screen} from '@testing-library/react'
import {NextIntlClientProvider} from 'next-intl'
import {describe, expect, it} from 'vitest'
import messages from '@/messages/es.json'
import {RecipeCard} from '../recipe-card'

const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ul>{ui}</ul>
    </NextIntlClientProvider>,
  )

describe('RecipeCard', () => {
  /**
   * The card used to be drawn on the link, which left the ingredient line --
   * a sibling of it, and necessarily so -- outside the box. The border moved
   * to the li; the DOM relationship did not change.
   */
  it('draws the card on the row so the ingredient line is inside it', () => {
    const {container} = wrap(
      <RecipeCard
        id="a"
        name="Arepa"
        imageUrl={null}
        ingredients={[
          {ingredientId: 'i1', name: 'Tomate', quantity: 200, unit: 'g'},
        ]}
      />,
    )
    const row = container.querySelector('li')
    expect(row).toHaveClass('border')
    expect(row?.querySelector('a')).not.toHaveClass('border')
    /* Inside the card, still outside the link. */
    const line = screen.getByText(/Tomate/)
    expect(row?.contains(line)).toBe(true)
    expect(row?.querySelector('a')?.contains(line)).toBe(false)
  })

  it('links to the recipe by its accessible name', () => {
    wrap(<RecipeCard id="abc" name="Arepa de huevo" imageUrl={null} />)
    expect(screen.getByRole('link', {name: /Arepa de huevo/})).toHaveAttribute(
      'href',
      '/recipes/abc',
    )
  })

  it('shows a letter tile when there is no thumbnail', () => {
    wrap(<RecipeCard id="a" name="arepa" imageUrl={null} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  /** Decorative: the link already carries the name, so alt is empty. */
  it('reserves image dimensions so loading cannot shift layout', () => {
    wrap(
      <RecipeCard
        id="a"
        name="Arepa"
        imageUrl="https://i.ytimg.com/vi/abc/mqdefault.jpg"
      />,
    )
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('width', '320')
    expect(img).toHaveAttribute('height', '180')
    expect(img).toHaveAttribute('alt', '')
  })

  it('falls back when no prep time is set', () => {
    wrap(<RecipeCard id="a" name="Arepa" imageUrl={null} />)
    expect(screen.getByText(messages.recipe.noTime)).toBeInTheDocument()
  })

  it('shows the prep time when there is one', () => {
    wrap(
      <RecipeCard id="a" name="Arepa" imageUrl={null} prepTimeMinutes={25} />,
    )
    expect(screen.getByText('25 min')).toBeInTheDocument()
  })

  describe('its ingredients', () => {
    const ingredients = [
      {ingredientId: 'i1', name: 'Tomate', quantity: 200, unit: 'g'} as const,
      {
        ingredientId: 'i2',
        name: 'Cebolla',
        quantity: 1,
        unit: 'unidad',
      } as const,
    ]

    it('names each one with how much of it there is', () => {
      wrap(
        <RecipeCard
          id="a"
          name="Arepa"
          imageUrl={null}
          ingredients={ingredients}
        />,
      )
      expect(screen.getByText('Tomate 200 g · Cebolla 1 unidad')).toBeVisible()
    })

    /**
     * Everything inside a link becomes its accessible name. Put there, a
     * list of recipes reads as a wall of text to anyone tabbing through it.
     */
    it('keeps them out of the link’s accessible name', () => {
      wrap(
        <RecipeCard
          id="a"
          name="Arepa"
          imageUrl={null}
          prepTimeMinutes={25}
          ingredients={ingredients}
        />,
      )
      const link = screen.getByRole('link')
      expect(link).toHaveAccessibleName('Arepa 25 min')
      expect(link).not.toHaveTextContent('Tomate')
    })

    it('says nothing at all when the recipe lists none', () => {
      wrap(<RecipeCard id="a" name="Arepa" imageUrl={null} ingredients={[]} />)
      expect(screen.queryByText(messages.recipe.ingredients)).toBeNull()
    })
  })
})
