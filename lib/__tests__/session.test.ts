import {beforeEach, describe, expect, it, vi} from 'vitest'

const auth = vi.fn()
vi.mock('@/auth', () => ({auth: () => auth()}))
vi.mock('../env', () => ({env: {ALLOWED_EMAILS: ['allowed@example.com']}}))
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

const {getSession, withAuth} = await import('../session')

beforeEach(() => auth.mockReset())

describe('getSession', () => {
  it('returns the email for an allowed account', async () => {
    auth.mockResolvedValue({user: {email: 'allowed@example.com'}})
    expect(await getSession()).toEqual({email: 'allowed@example.com'})
  })

  it('normalises case and whitespace', async () => {
    auth.mockResolvedValue({user: {email: '  ALLOWED@Example.com '}})
    expect(await getSession()).toEqual({email: 'allowed@example.com'})
  })

  /** A JWT stays valid after its address leaves the list, so it is rechecked. */
  it('refuses an account no longer on the allowlist', async () => {
    auth.mockResolvedValue({user: {email: 'removed@example.com'}})
    expect(await getSession()).toBeNull()
  })

  it.each([null, {}, {user: {}}, {user: {email: null}}])(
    'refuses %j',
    async value => {
      auth.mockResolvedValue(value)
      expect(await getSession()).toBeNull()
    },
  )
})

describe('withAuth', () => {
  it('runs the handler with the session', async () => {
    auth.mockResolvedValue({user: {email: 'allowed@example.com'}})
    const handler = vi.fn(async () => Response.json({ok: true}))
    const response = await withAuth(handler)(new Request('http://t/'), {})
    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      {},
      {
        email: 'allowed@example.com',
      },
    )
  })

  it('returns 401 and never calls the handler without a session', async () => {
    auth.mockResolvedValue(null)
    const handler = vi.fn(async () => Response.json({ok: true}))
    const response = await withAuth(handler)(new Request('http://t/'), {})
    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not let a 401 be cached', async () => {
    auth.mockResolvedValue(null)
    const response = await withAuth(async () => Response.json({}))(
      new Request('http://t/'),
      {},
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
