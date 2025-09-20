/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  // Force all pages to be dynamic
  experimental: {
    staticPageGenerationTimeout: 0,
  },
  // Disable static generation for all pages
  generateStaticParams: false,
  // Skip static generation
  skipTrailingSlashRedirect: true,
};

export default nextConfig;