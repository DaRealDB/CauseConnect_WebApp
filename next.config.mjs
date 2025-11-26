/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Remove ignoreBuildErrors in production for better code quality
  // Uncomment these for production builds:
  // eslint: {
  //   ignoreDuringBuilds: false,
  // },
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  eslint: {
    ignoreDuringBuilds: true, // Remove this in production
  },
  typescript: {
    ignoreBuildErrors: true, // Remove this in production
  },
  images: {
    // Enable image optimization in production
    // Add your backend domain for remote images
    domains: process.env.NEXT_PUBLIC_API_URL 
      ? [new URL(process.env.NEXT_PUBLIC_API_URL).hostname]
      : [],
    unoptimized: process.env.NODE_ENV === 'production' ? false : true,
  },
}

export default nextConfig
