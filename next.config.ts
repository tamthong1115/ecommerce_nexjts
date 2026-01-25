import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    '@prisma/client-runtime-utils',
  ],
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'salt.tikicdn.com',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'res.cloudinary.com',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'img.icons8.com',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'cdn.jsdelivr.net',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'avatars.githubusercontent.com',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'placehold.co',
        port: '',
        protocol: 'https',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
