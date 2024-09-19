/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'pog-five.vercel.app'].filter(Boolean),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'https://pog-five.vercel.app/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig