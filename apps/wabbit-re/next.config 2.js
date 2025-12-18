/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/wabbit-re',
  assetPrefix: '/wabbit-re',
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
    NEXT_PUBLIC_APP_NAME: 'Wabbit RE',
    NEXT_PUBLIC_BASE_PATH: '/wabbit-re',
  },
  output: 'standalone',
}

module.exports = nextConfig