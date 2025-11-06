import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['knex'],

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true
      }
    ]
  },

};

export default nextConfig;
