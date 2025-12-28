/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  // No basePath since this is the root dashboard
  // Other apps use subdirectory routing in production
  env: {
    NEXT_PUBLIC_APP_NAME: 'GS Site Dashboard',
    NEXT_PUBLIC_BASE_PATH: '',
  },
  output: 'standalone',
};

module.exports = nextConfig;
