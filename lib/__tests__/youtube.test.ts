import {describe, expect, it} from 'vitest'
import {deriveImageUrl, thumbnailUrlFor, youtubeIdFrom} from '../youtube'

const ID = 'dQw4w9WgXcQ'

describe('youtubeIdFrom', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`, 'watch'],
    [`https://youtube.com/watch?v=${ID}&t=42s`, 'watch with params'],
    [`https://m.youtube.com/watch?v=${ID}`, 'mobile'],
    [`https://music.youtube.com/watch?v=${ID}`, 'music'],
    [`https://youtu.be/${ID}`, 'short link'],
    [`https://youtu.be/${ID}?t=90`, 'short link with timestamp'],
    [`https://www.youtube.com/embed/${ID}`, 'embed'],
    [`https://www.youtube.com/shorts/${ID}`, 'shorts'],
    [`https://www.youtube.com/live/${ID}`, 'live'],
    [`  https://youtu.be/${ID}  `, 'padded'],
  ])('reads %s (%s)', url => {
    expect(youtubeIdFrom(url)).toBe(ID)
  })

  it.each([
    ['https://example.com/recipe', 'another site'],
    ['https://www.youtube.com/@somechannel', 'a channel page'],
    ['https://www.youtube.com/watch?v=tooshort', 'a malformed id'],
    ['not a url at all', 'not a url'],
    ['', 'empty'],
    [`javascript:alert(1)//youtu.be/${ID}`, 'a non-http scheme'],
    [`https://notyoutube.com/watch?v=${ID}`, 'a lookalike host'],
  ])('returns null for %s (%s)', url => {
    expect(youtubeIdFrom(url)).toBeNull()
  })
})

describe('thumbnailUrlFor', () => {
  it('builds the mqdefault URL', () => {
    expect(thumbnailUrlFor(`https://youtu.be/${ID}`)).toBe(
      `https://i.ytimg.com/vi/${ID}/mqdefault.jpg`,
    )
  })
  it('uses mqdefault, never maxresdefault — that 404s on older videos', () => {
    expect(thumbnailUrlFor(`https://youtu.be/${ID}`)).not.toContain('maxres')
  })
  it('is null for a non-video link', () => {
    expect(thumbnailUrlFor('https://example.com')).toBeNull()
  })
})

describe('deriveImageUrl', () => {
  it('takes the first link that yields a thumbnail', () => {
    expect(
      deriveImageUrl(['https://example.com/a', `https://youtu.be/${ID}`]),
    ).toBe(`https://i.ytimg.com/vi/${ID}/mqdefault.jpg`)
  })
  it('is null when nothing does — the signal to render a letter tile', () => {
    expect(
      deriveImageUrl(['https://example.com', 'https://blog.test']),
    ).toBeNull()
    expect(deriveImageUrl([])).toBeNull()
  })
})
