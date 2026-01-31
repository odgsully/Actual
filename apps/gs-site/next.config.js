/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: false,
  },
  // NO basePath - dashboard is at root (pickleballisapsyop.com)
  env: {
    NEXT_PUBLIC_APP_NAME: 'GS Dashboard',
    NEXT_PUBLIC_BASE_PATH: '',
  },
  output: 'standalone',
};

module.exports = nextConfig;
