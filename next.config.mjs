/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  // Force all pages to be dynamic
  trailingSlash: false,
  // Disable static optimization completely
  experimental: {
    forceSwcTransforms: true,
  },
  // Force all pages to be dynamic
  output: 'standalone',
};

export default nextConfig;