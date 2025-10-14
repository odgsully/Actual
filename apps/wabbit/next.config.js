/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/wabbit',
  assetPrefix: '/wabbit',
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
    NEXT_PUBLIC_APP_NAME: 'Wabbit',
    NEXT_PUBLIC_BASE_PATH: '/wabbit',
  },
  output: 'standalone',
}

module.exports = nextConfig