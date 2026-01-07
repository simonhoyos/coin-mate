import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['knex'],

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/history',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
