/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com'], // allow external images
  },
  output: 'standalone', // Optimize for Vercel deployment
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      };
    }
    return config;
  },
}

module.exports = nextConfig
