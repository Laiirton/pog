/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_DRIVE_TOKENS: process.env.GOOGLE_DRIVE_TOKENS,
  },
}

module.exports = nextConfig;