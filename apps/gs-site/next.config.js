/** @type {import('next').NextConfig} */

// Determine basePath based on deployment target
// DEPLOY_TARGET=growthadvisory uses /private/gs-site path
const isGrowthAdvisory = process.env.DEPLOY_TARGET === 'growthadvisory';
const basePath = isGrowthAdvisory ? '/private/gs-site' : '';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: false, // Disabled - dd-trace causes issues
  },
  // basePath for growthadvisory.ai deployment
  // Set DEPLOY_TARGET=growthadvisory in Vercel env vars for that domain
  ...(basePath && {
    basePath,
    assetPrefix: basePath,
  }),
  env: {
    NEXT_PUBLIC_APP_NAME: 'GS Site Dashboard',
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: 'standalone',
};

module.exports = nextConfig;
