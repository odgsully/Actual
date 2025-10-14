import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No basePath since this is the root dashboard
  env: {
    NEXT_PUBLIC_APP_NAME: 'GS Site Dashboard',
  },
  output: 'standalone',
};

export default nextConfig;
