/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'pog-five.vercel.app', 'tycfnjqspnvgyhjsjvfs.supabase.co', 'pog-git-master-lairtons-projects.vercel.app'],
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
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig