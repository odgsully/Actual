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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  output: 'standalone',
};

module.exports = nextConfig;
