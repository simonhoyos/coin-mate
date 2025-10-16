import { z } from 'zod';

export function createConfig() {
  const config = z
    .object({
      DATABASE_URL: z.string(),
      JWT_SECRET: z.string().min(32),
    })
    .parse(process.env);

  return config;
}

export type IConfig = ReturnType<typeof createConfig>;
