import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-maps.yandex.ru',
      },
    ],
  },
}

export default nextConfig