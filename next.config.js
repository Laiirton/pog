/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
    GOOGLE_DRIVE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'drive.google.com'],
  },
  serverRuntimeConfig: {
    // Adicione isso para usar fs no servidor
    fs: 'empty'
  },
}

export default nextConfig;