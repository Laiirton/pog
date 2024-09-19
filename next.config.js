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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://pog-git-master-lairtons-projects.vercel.app, https://pog-five.vercel.app, https://pog-a1877eeot-lairtons-projects.vercel.app",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig