import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Helper function to set tenant context for RLS
export async function setTenantContext(tenantId: string) {
  await db.execute(`SET LOCAL app.current_tenant = '${tenantId}'`);
}

// Helper function to clear tenant context
export async function clearTenantContext() {
  await db.execute(`SET LOCAL app.current_tenant = ''`);
}

export * from './schema';
export type Database = typeof db;