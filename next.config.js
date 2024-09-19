/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_MEDIA_API_URL].filter(Boolean).map(domain => domain.replace(/^https?:\/\//, '')),
  },
  // Outras configurações existentes (se houver)
}

module.exports = nextConfig