/** @type {import('next').NextConfig} */

// Determine basePath based on deployment target
// DEPLOY_TARGET=growthadvisory uses /private/realty-admin path
// Default production uses /gsrealty path
const isGrowthAdvisory = process.env.DEPLOY_TARGET === 'growthadvisory';
const isProduction = process.env.NODE_ENV === 'production';

let basePath = '';
if (isProduction) {
  basePath = isGrowthAdvisory ? '/private/realty-admin' : '/gsrealty';
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  // basePath for production deployments
  // Set DEPLOY_TARGET=growthadvisory in Vercel env vars for growthadvisory.ai
  ...(basePath && {
    basePath,
    assetPrefix: basePath,
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
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: 'standalone',
}

module.exports = nextConfig