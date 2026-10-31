import type {NextConfig} from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  /** Thumbnails are derived from YouTube links; nothing else is remote. */
  images: {
    remotePatterns: [
      {protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**'},
    ],
  },
}

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig)
