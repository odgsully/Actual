/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // basePath: '/gsrealty',  // Commented out for root path deployment
  // assetPrefix: '/gsrealty',  // Commented out for root path deployment
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
    NEXT_PUBLIC_BASE_PATH: '/gsrealty',
  },
  output: 'standalone',
}

module.exports = nextConfig