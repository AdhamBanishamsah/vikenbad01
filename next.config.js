/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'fonts.gstatic.com', 'fonts.googleapis.com'],
    unoptimized: true
  },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  trailingSlash: true,
}

module.exports = nextConfig 