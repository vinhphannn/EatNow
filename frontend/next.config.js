// Cấu hình Next.js: domain ảnh và các thiết lập cơ bản
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration
  images: {
    domains: ["localhost", "images.unsplash.com", "res.cloudinary.com", "lh3.googleusercontent.com"],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
