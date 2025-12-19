/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use basePath in production for multi-app deployment
  // In development, run at root for easier local development
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/gsrealty',
    assetPrefix: '/gsrealty',
  }),
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'GSRealty Client Manager',
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === 'production' ? '/gsrealty' : '',
  },
  output: 'standalone',
}

module.exports = nextConfig