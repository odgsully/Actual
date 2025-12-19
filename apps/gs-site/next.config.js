/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No basePath since this is the root dashboard
  env: {
    NEXT_PUBLIC_APP_NAME: 'GS Site Dashboard',
  },
  output: 'standalone',
};

module.exports = nextConfig;
