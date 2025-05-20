/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable image optimization for simplicity
  images: {
    unoptimized: true,
  },
  // Properly configure experimental features
  experimental: {
    // In Next.js 15.2.4, serverActions should be an object or removed entirely as it's enabled by default
    // Remove the serverActions flag entirely
  },
};

export default nextConfig;
