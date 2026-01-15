/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: instrumentationHook disabled - dd-trace not installed
  // Re-enable when DataDog APM is configured
  // Only use basePath in production for multi-app deployment
  // In development, run at root for easier local development
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/wabbit',
    assetPrefix: '/wabbit',
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
    NEXT_PUBLIC_APP_NAME: 'Wabbit',
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === 'production' ? '/wabbit' : '',
  },
  output: 'standalone',
}

module.exports = nextConfig