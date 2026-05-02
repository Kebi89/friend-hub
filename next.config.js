/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com', ['images.unsplash.com']], // allow external images
  },
  output: 'standalone', // Optimize for Vercel deployment
}

module.exports = nextConfig