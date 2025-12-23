/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Base path for deployment at /system/pos
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    domains: ['localhost', 'via.placeholder.com', 'emishops.net'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'pos_api',
      },
      {
        protocol: 'https',
        hostname: 'emishops.net',
      },
    ],
  },
};

module.exports = nextConfig;

