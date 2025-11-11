import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['knex'],

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/expenses',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
