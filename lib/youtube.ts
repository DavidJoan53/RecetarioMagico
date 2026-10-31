/**
 * Recipe thumbnails are derived from a YouTube link rather than stored.
 *
 * The thumbnail address is a pure function of the video id, so there is no
 * network call, no scraping, and no file to keep. mqdefault is 320x180 — the
 * exact size the list renders — which is why these are served straight from
 * Google's CDN instead of through Next's image optimiser, where resizing a
 * correctly-sized image would spend quota to save a couple of kilobytes.
 */

const ID = /^[\w-]{11}$/

const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

/**
 * Extracts the 11-character video id from any of YouTube's URL shapes:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/.
 *
 * Returns null for anything else — a blog link, a malformed URL, a YouTube
 * channel page. Callers treat null as "this link has no thumbnail", which is
 * a normal case rather than an error.
 */
export function youtubeIdFrom(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (!HOSTS.has(parsed.hostname)) return null

  // youtu.be/<id>
  if (parsed.hostname.endsWith('youtu.be')) {
    const id = parsed.pathname.slice(1).split('/')[0]
    return id && ID.test(id) ? id : null
  }

  // youtube.com/watch?v=<id>
  const v = parsed.searchParams.get('v')
  if (v && ID.test(v)) return v

  // youtube.com/{embed,shorts,live}/<id>
  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length >= 2 && segments[0] && segments[1]) {
    if (['embed', 'shorts', 'live'].includes(segments[0])) {
      return ID.test(segments[1]) ? segments[1] : null
    }
  }

  return null
}

/**
 * mqdefault rather than maxresdefault: the latter 404s on older videos, and a
 * broken image is worse than a slightly smaller one.
 */
export function thumbnailUrlFor(url: string): string | null {
  const id = youtubeIdFrom(url)
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null
}

/** Dimensions of mqdefault, so images can reserve space and never shift layout. */
export const THUMBNAIL_SIZE = {width: 320, height: 180} as const

/**
 * The thumbnail for a recipe: the first link that yields one. Null when none
 * do, which is the signal to render a letter tile instead of scraping the
 * page for an Open Graph image.
 */
export function deriveImageUrl(links: readonly string[]): string | null {
  for (const link of links) {
    const thumbnail = thumbnailUrlFor(link)
    if (thumbnail) return thumbnail
  }
  return null
}
