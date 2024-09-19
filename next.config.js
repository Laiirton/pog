/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_MEDIA_API_URL].filter(Boolean).map(domain => domain.replace(/^https?:\/\//, '')),
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporariamente ignore os erros de ESLint durante o build
  },
  typescript: {
    ignoreBuildErrors: true, // Use isso apenas temporariamente
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'https://your-vercel-deployment-url.vercel.app/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig