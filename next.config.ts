import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  // Recipe thumbnails are derived from YouTube links rather than stored, so the
  // only remote host we ever load images from is YouTube's thumbnail CDN.
  images: {
    remotePatterns: [{protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**'}],
  },
}

export default nextConfig
