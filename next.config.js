/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  env: {
    GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
    GOOGLE_DRIVE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
}

export default nextConfig;