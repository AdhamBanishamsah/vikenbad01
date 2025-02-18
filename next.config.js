/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  experimental: {
    serverActions: true
  },
  trailingSlash: true,
}

module.exports = nextConfig 