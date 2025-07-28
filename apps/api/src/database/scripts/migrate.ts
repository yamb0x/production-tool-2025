#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Runs database migrations and optionally seeds data
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { connectToDatabase, disconnectFromDatabase, client } from '../connection';
import seedDevelopmentData from '../seeds/dev-seed';

async function runMigrations() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Check if migrations table exists
    const migrationsTableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `;
    
    // Create migrations table if it doesn't exist
    if (!migrationsTableExists[0].exists) {
      console.log('📋 Creating migrations table...');
      await client`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW()
        );
      `;
    }
    
    // Get list of executed migrations
    const executedMigrations = await client`
      SELECT filename FROM migrations ORDER BY id;
    `;
    
    const executedFilenames = executedMigrations.map(m => m.filename);
    
    // Migration files to run
    const migrationFiles = [
      '0001_initial_schema.sql'
    ];
    
    // Run pending migrations
    for (const filename of migrationFiles) {
      if (!executedFilenames.includes(filename)) {
        console.log(`⏳ Running migration: ${filename}...`);
        
        const migrationPath = join(__dirname, '../migrations', filename);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        
        // Execute migration in a transaction
        await client.begin(async sql => {
          await sql.unsafe(migrationSQL);
          await sql`
            INSERT INTO migrations (filename) VALUES (${filename});
          `;
        });
        
        console.log(`✅ Migration completed: ${filename}`);
      } else {
        console.log(`⏭️  Skipping already executed migration: ${filename}`);
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function runSeeds() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Check if we're in development environment
    if (process.env.NODE_ENV !== 'production') {
      await seedDevelopmentData();
    } else {
      console.log('ℹ️  Skipping seed data in production environment');
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        await runMigrations();
        break;
      case 'seed':
        await runSeeds();
        break;
      case 'reset':
        console.log('🗑️  Resetting database...');
        await resetDatabase();
        await runMigrations();
        await runSeeds();
        break;
      default:
        // Run both migrations and seeds by default
        await runMigrations();
        if (process.env.NODE_ENV !== 'production') {
          await runSeeds();
        }
        break;
    }
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
  }
}

async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete all data!');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production!');
  }
  
  try {
    // Drop all tables in the correct order (reverse of creation)
    await client`DROP TABLE IF EXISTS backup_snapshots CASCADE;`;
    await client`DROP TABLE IF EXISTS data_version_history CASCADE;`;
    await client`DROP TABLE IF EXISTS notification_queue CASCADE;`;
    await client`DROP TABLE IF EXISTS saved_jobs CASCADE;`;
    await client`DROP TABLE IF EXISTS job_applications CASCADE;`;
    await client`DROP TABLE IF EXISTS job_listings CASCADE;`;
    await client`DROP TABLE IF EXISTS audit_log CASCADE;`;
    await client`DROP TABLE IF EXISTS cache_invalidation CASCADE;`;
    await client`DROP TABLE IF EXISTS project_phases CASCADE;`;
    await client`DROP TABLE IF EXISTS availability_patterns CASCADE;`;
    await client`DROP TABLE IF EXISTS booking_events CASCADE;`;
    await client`DROP TABLE IF EXISTS bookings CASCADE;`;
    await client`DROP TABLE IF EXISTS artist_profiles CASCADE;`;
    await client`DROP TABLE IF EXISTS artists CASCADE;`;
    await client`DROP TABLE IF EXISTS projects CASCADE;`;
    await client`DROP TABLE IF EXISTS users CASCADE;`;
    await client`DROP TABLE IF EXISTS tenants CASCADE;`;
    await client`DROP TABLE IF EXISTS migrations CASCADE;`;
    
    // Drop enums
    await client`DROP TYPE IF EXISTS event_type CASCADE;`;
    await client`DROP TYPE IF EXISTS hold_type CASCADE;`;
    await client`DROP TYPE IF EXISTS project_status CASCADE;`;
    await client`DROP TYPE IF EXISTS booking_status CASCADE;`;
    await client`DROP TYPE IF EXISTS application_status CASCADE;`;
    await client`DROP TYPE IF EXISTS job_type CASCADE;`;
    await client`DROP TYPE IF EXISTS job_status CASCADE;`;
    await client`DROP TYPE IF EXISTS artist_type CASCADE;`;
    await client`DROP TYPE IF EXISTS user_role CASCADE;`;
    await client`DROP TYPE IF EXISTS tenant_type CASCADE;`;
    
    // Drop functions
    await client`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`;
    await client`DROP FUNCTION IF EXISTS set_tenant_context(uuid) CASCADE;`;
    
    console.log('🗑️  Database reset completed');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}