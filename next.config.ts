import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'assets.roofle.com',
      },
      {
        protocol: 'https',
        hostname: 'imagecdn.owenscorning.com',
      },
    ],
  },
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
