/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  // Force all pages to be dynamic
  trailingSlash: false,
  // Force all pages to be dynamic
  output: 'standalone',
  // Disable static optimization completely
  experimental: {
    forceSwcTransforms: true,
    // Disable static generation
    staticWorkerRequestDeduping: false,
  },
  // Force all pages to be server-side rendered
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;