// Cấu hình Next.js: domain ảnh và các thiết lập cơ bản
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hybrid configuration - static pages + dynamic routes
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    domains: ["localhost", "images.unsplash.com"],
  },
  // Disable server-side features
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
