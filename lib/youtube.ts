const ID = /^[\w-]{11}$/

const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

/** Handles watch?v=, youtu.be, /embed/, /shorts/, /live/. Null otherwise. */
export function youtubeIdFrom(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (!HOSTS.has(parsed.hostname)) return null

  if (parsed.hostname.endsWith('youtu.be')) {
    const id = parsed.pathname.slice(1).split('/')[0]
    return id && ID.test(id) ? id : null
  }

  const v = parsed.searchParams.get('v')
  if (v && ID.test(v)) return v

  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length >= 2 && segments[0] && segments[1]) {
    if (['embed', 'shorts', 'live'].includes(segments[0])) {
      return ID.test(segments[1]) ? segments[1] : null
    }
  }

  return null
}

/** mqdefault, not maxresdefault — the latter 404s on older videos. */
export function thumbnailUrlFor(url: string): string | null {
  const id = youtubeIdFrom(url)
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null
}

/** Dimensions of mqdefault, so images can reserve space. */
export const THUMBNAIL_SIZE = {width: 320, height: 180} as const

/** First link that yields a thumbnail. Null means render a letter tile. */
export function deriveImageUrl(links: readonly string[]): string | null {
  for (const link of links) {
    const thumbnail = thumbnailUrlFor(link)
    if (thumbnail) return thumbnail
  }
  return null
}
