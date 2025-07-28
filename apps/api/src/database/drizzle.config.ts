import type { Config } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default {
  schema: '../../../src/lib/db/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  // Enable GIST support for PostgreSQL
  schemaFilter: ['public'],
  tablesFilter: ['*'],
} satisfies Config;