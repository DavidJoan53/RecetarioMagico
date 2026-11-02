import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {PAGE_SIZE} from '@/lib/validation/page'
import messages from '@/messages/es.json'
import {LoadMore} from '../load-more'

const m = messages.common
const loadMore = `Cargar ${PAGE_SIZE} más`

/** Nothing observes in jsdom, so scrolling to the end is driven by hand. */
let observed: (() => void) | null = null
beforeEach(() => {
  observed = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: (e: {isIntersecting: boolean}[]) => void) {}
      observe() {
        observed = () => this.cb([{isIntersecting: true}])
      }
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function setup(props: Partial<React.ComponentProps<typeof LoadMore>> = {}) {
  const onLoadMore = vi.fn()
  const view = render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <LoadMore hasMore isLoading={false} onLoadMore={onLoadMore} {...props} />
    </NextIntlClientProvider>,
  )
  const rerender = (next: Partial<React.ComponentProps<typeof LoadMore>>) =>
    view.rerender(
      <NextIntlClientProvider locale="es" messages={messages}>
        <LoadMore
          hasMore
          isLoading={false}
          onLoadMore={onLoadMore}
          {...props}
          {...next}
        />
      </NextIntlClientProvider>,
    )
  return {onLoadMore, rerender}
}

describe('LoadMore', () => {
  /** A list that fits says nothing: there is no end to announce. */
  it('renders nothing when there was never more', () => {
    const {container} = render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <LoadMore hasMore={false} isLoading={false} onLoadMore={vi.fn()} />
      </NextIntlClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('offers a page at a time', () => {
    setup()
    expect(screen.getByRole('button', {name: loadMore})).toBeInTheDocument()
  })

  it('asks for the next page when pressed', async () => {
    const {onLoadMore} = setup()
    await userEvent.click(screen.getByRole('button', {name: loadMore}))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  /** The only other way on is scrolling, which a keyboard does not do here. */
  it('asks for the next page when it is scrolled to', async () => {
    const {onLoadMore} = setup()
    observed?.()
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledOnce())
  })

  it('says it is loading, out loud as well as on the button', () => {
    setup({isLoading: true})
    const button = screen.getByRole('button', {name: m.loadingMore})
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(m.loadingMore)
  })

  /**
   * disabled would drop the button out of the tab order mid-press, sending
   * focus to the body — so it stays pressable and only says it is busy.
   */
  it('stays focusable while loading', () => {
    setup({isLoading: true})
    expect(screen.getByRole('button', {name: m.loadingMore})).not.toBeDisabled()
  })

  /** The button it was on is gone; without this, focus falls to the body. */
  it('takes focus when pressing it reached the end', async () => {
    const {rerender} = setup()
    await userEvent.click(screen.getByRole('button', {name: loadMore}))
    rerender({hasMore: false})

    const end = await screen.findByText(m.endOfList)
    expect(end).toHaveFocus()
  })

  /** Scrolling to the end moved nobody's focus, so there is nothing to catch. */
  it('says nothing when scrolling reached the end', async () => {
    const {rerender} = setup()
    observed?.()
    rerender({hasMore: false})
    await waitFor(() => expect(screen.queryByText(m.endOfList)).toBeNull())
  })
})
