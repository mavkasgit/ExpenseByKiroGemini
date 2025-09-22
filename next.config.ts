import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-maps.yandex.ru',
        pathname: '/1.x/**'
      }
    ]
  }
}

export default nextConfig
