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
})
