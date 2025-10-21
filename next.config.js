/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["dayjs", "swr"]
  }
};

module.exports = nextConfig;
