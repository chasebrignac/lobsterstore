import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.lobsterloop.com',
          },
        ],
        destination: 'https://lobsterloop.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
