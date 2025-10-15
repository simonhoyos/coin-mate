import type { NextConfig } from 'next';

const optionalKnexDrivers = [
  'better-sqlite3',
  'mysql',
  'mysql2',
  'oracledb',
  'pg-query-stream',
  'sqlite3',
  'tedious',
];

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['knex'],
  },

  webpack: (config) => {
    if (Array.isArray(config.externals)) {
      config.externals.push(...optionalKnexDrivers);
    } else if (config.externals != null) {
      config.externals = [config.externals, ...optionalKnexDrivers];
    } else {
      config.externals = [...optionalKnexDrivers];
    }

    config.resolve ??= {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      ...optionalKnexDrivers.reduce<Record<string, false>>((acc, name) => {
        acc[name] = false;
        return acc;
      }, {}),
    };

    return config;
  },
};

export default nextConfig;
