import {act, fireEvent, render, screen} from '@testing-library/react'
import {NextIntlClientProvider} from 'next-intl'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {SUCCESS_MS, type ToastInput} from '@/lib/toast'
import messages from '@/messages/es.json'
import {ToastProvider, useToast} from '../toast-provider'

/** Raises whatever the test hands it, on click. */
function Raise({input}: {input: ToastInput}) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast(input)}>
      go
    </button>
  )
}

const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  )

const go = () => fireEvent.click(screen.getByRole('button', {name: 'go'}))

/**
 * Whether a toast is up, asked through its dismiss button. The message itself
 * is in the document twice on purpose — once in the live region, once in the
 * toast's own aria-hidden paragraph — so matching on the text matches both.
 */
const dismisser = (message: string) =>
  screen.queryByRole('button', {name: `Descartar: ${message}`})

/** The leave transition has to play out before the toast is unmounted. */
const LEAVE_MS = 150

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ToastProvider', () => {
  /**
   * The failure this guards: a live region that is mounted together with its
   * text already inside is routinely never announced at all.
   */
  it('mounts both regions empty, before there is anything to say', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(screen.getByRole('alert')).toHaveTextContent('')
  })

  it('announces a success politely', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    expect(screen.getByRole('status')).toHaveTextContent('Cena registrada')
    expect(screen.getByRole('alert')).toHaveTextContent('')
  })

  /** A failed write interrupts; it is not something to find later. */
  it('announces a failure assertively', () => {
    wrap(<Raise input={{message: 'Esa cena ya no existe.', tone: 'error'}} />)
    go()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Esa cena ya no existe.',
    )
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  /**
   * Two of the same message in a row. Writing the same string mutates no node,
   * so without a fresh element the second one is silent.
   */
  it('says an identical message again rather than going quiet', () => {
    wrap(<Raise input={{message: 'Ingrediente añadido'}} />)
    go()
    const first = screen.getByRole('status').firstElementChild
    go()
    const second = screen.getByRole('status').firstElementChild
    expect(first).not.toBe(second)
    expect(screen.getByRole('status')).toHaveTextContent('Ingrediente añadido')
  })

  /**
   * The gesture below is unreachable by keyboard, so this button is the one
   * that has to work. Named per toast: a stack of them all reading
   * "Descartar" says nothing about which is which.
   */
  it('names the dismiss button after what it discards', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    expect(
      screen.getByRole('button', {name: 'Descartar: Cena registrada'}),
    ).toBeInTheDocument()
  })

  it('dismisses on the button', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    const button = dismisser('Cena registrada')
    if (!button) throw new Error('no dismiss button')
    fireEvent.click(button)
    tick(LEAVE_MS)
    expect(dismisser('Cena registrada')).toBeNull()
  })

  it('takes a success off screen once its time is up', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    expect(dismisser('Cena registrada')).toBeInTheDocument()
    tick(SUCCESS_MS + LEAVE_MS)
    expect(dismisser('Cena registrada')).toBeNull()
  })

  it('leaves a failure up with no timer to take it away', () => {
    wrap(<Raise input={{message: 'No se pudo guardar.', tone: 'error'}} />)
    go()
    tick(SUCCESS_MS * 10)
    expect(dismisser('No se pudo guardar.')).toBeInTheDocument()
  })

  /**
   * A toast that vanishes while being reached for takes its dismiss button
   * with it. The countdown holds, and resumes with what was left of it.
   */
  it('holds the countdown while the pointer is over it', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    const toast = screen.getByTestId('toast-0')

    tick(3000)
    fireEvent.pointerEnter(toast)
    tick(SUCCESS_MS * 2)
    expect(dismisser('Cena registrada')).toBeInTheDocument()

    fireEvent.pointerLeave(toast)
    tick(2000 + LEAVE_MS)
    expect(dismisser('Cena registrada')).toBeNull()
  })

  it('holds the countdown while something inside it has focus', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    const button = dismisser('Cena registrada')
    if (!button) throw new Error('no dismiss button')
    fireEvent.focus(button)
    tick(SUCCESS_MS * 2)
    expect(dismisser('Cena registrada')).toBeInTheDocument()
  })

  /** Otherwise tabbing through a toast leaves it on screen for good. */
  it('resumes the countdown once focus has left', () => {
    wrap(<Raise input={{message: 'Cena registrada'}} />)
    go()
    const button = dismisser('Cena registrada')
    if (!button) throw new Error('no dismiss button')
    fireEvent.focus(button)
    tick(SUCCESS_MS * 2)
    fireEvent.blur(button)
    tick(SUCCESS_MS + LEAVE_MS)
    expect(dismisser('Cena registrada')).toBeNull()
  })

  /**
   * The test id is the gesture's target and nothing else — a drag has no
   * accessible equivalent to query by, which is the whole reason the dismiss
   * button above exists. Everything these assert goes through that button.
   */
  describe('swiping', () => {
    const swipe = (to: number) => {
      const toast = screen.getByTestId('toast-0')
      fireEvent.pointerDown(toast, {clientX: 0, pointerId: 1, button: 0})
      fireEvent.pointerMove(toast, {clientX: to, pointerId: 1})
      fireEvent.pointerUp(toast, {clientX: to, pointerId: 1})
      return toast
    }

    it('dismisses when dragged far enough', () => {
      wrap(<Raise input={{message: 'Cena registrada'}} />)
      go()
      swipe(200)
      tick(LEAVE_MS)
      expect(dismisser('Cena registrada')).toBeNull()
    })

    it('springs back when let go short of the threshold', () => {
      wrap(<Raise input={{message: 'Cena registrada'}} />)
      go()
      const toast = swipe(20)
      expect(dismisser('Cena registrada')).toBeInTheDocument()
      expect(toast).not.toHaveStyle({transform: 'translateX(20px)'})
    })

    /** Leftwards there is nothing to dismiss towards, so it does not move. */
    it('ignores a drag to the left', () => {
      wrap(<Raise input={{message: 'Cena registrada'}} />)
      go()
      const toast = swipe(-200)
      expect(dismisser('Cena registrada')).toBeInTheDocument()
      expect(toast).not.toHaveStyle({transform: 'translateX(-200px)'})
    })

    /** A right-click is a context menu, not the start of a gesture. */
    it('does not drag on a secondary button', () => {
      wrap(<Raise input={{message: 'Cena registrada'}} />)
      go()
      const toast = screen.getByTestId('toast-0')
      fireEvent.pointerDown(toast, {
        clientX: 0,
        pointerId: 1,
        button: 2,
        pointerType: 'mouse',
      })
      fireEvent.pointerMove(toast, {clientX: 200, pointerId: 1})
      fireEvent.pointerUp(toast, {clientX: 200, pointerId: 1})
      tick(LEAVE_MS)
      expect(dismisser('Cena registrada')).toBeInTheDocument()
      expect(toast).not.toHaveStyle({transform: 'translateX(200px)'})
    })

    /**
     * The gesture is interrupted — a call arrives, the pointer leaves the
     * screen. Cancelling is a release, so the toast stays rather than being
     * left mid-drag with no way back.
     */
    it('springs back when the gesture is cancelled', () => {
      wrap(<Raise input={{message: 'Cena registrada'}} />)
      go()
      const toast = screen.getByTestId('toast-0')
      fireEvent.pointerDown(toast, {clientX: 0, pointerId: 1, button: 0})
      fireEvent.pointerMove(toast, {clientX: 40, pointerId: 1})
      fireEvent.pointerCancel(toast, {clientX: 40, pointerId: 1})
      expect(dismisser('Cena registrada')).toBeInTheDocument()
      expect(toast).not.toHaveStyle({transform: 'translateX(40px)'})
    })
  })

  /** Rendered outside a provider in isolation; it must not throw. */
  it('does nothing rather than crashing with no provider', () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <Raise input={{message: 'ignored'}} />
      </NextIntlClientProvider>,
    )
    go()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
