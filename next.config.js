/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'pog-five.vercel.app', 'tycfnjqspnvgyhjsjvfs.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://pog-five.vercel.app/api/:path*'
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig