#!/usr/bin/env tsx
/**
 * Database Backup Script
 * Creates automated backups with compression and verification
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { connectToDatabase, disconnectFromDatabase, db } from '../connection';
import { backupSnapshots } from '../../../../src/lib/db/schema';

interface BackupOptions {
  type: 'full' | 'incremental' | 'tenant';
  tenantId?: string;
  compression?: boolean;
  encryption?: boolean;
  outputDir?: string;
}

class DatabaseBackup {
  private databaseUrl: string;
  private backupDir: string;

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
    
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(options: BackupOptions = { type: 'full', compression: true }) {
    console.log(`🗄️  Starting ${options.type} backup...`);
    
    try {
      await connectToDatabase();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${options.type}-${timestamp}`;
      const backupPath = join(this.backupDir, filename);
      
      // Create backup snapshot record
      const [snapshot] = await db.insert(backupSnapshots).values({
        snapshotType: options.type,
        status: 'in_progress',
        startedAt: new Date(),
        metadata: {
          compression: options.compression,
          encryption: options.encryption || false
        }
      }).returning();
      
      try {
        let dumpCommand = '';
        
        if (options.type === 'full') {
          dumpCommand = this.buildFullBackupCommand(backupPath);
        } else if (options.type === 'tenant' && options.tenantId) {
          dumpCommand = this.buildTenantBackupCommand(backupPath, options.tenantId);
        } else {
          throw new Error(`Backup type ${options.type} not implemented`);
        }
        
        console.log('⏳ Running pg_dump...');
        execSync(dumpCommand, { stdio: 'pipe' });
        
        // Compress if requested
        let finalPath = `${backupPath}.sql`;
        if (options.compression) {
          console.log('🗜️  Compressing backup...');
          execSync(`gzip "${finalPath}"`);
          finalPath = `${finalPath}.gz`;
        }
        
        // Calculate checksum
        const fileContent = readFileSync(finalPath);
        const checksum = createHash('sha256').update(fileContent).digest('hex');
        const sizeBytes = fileContent.length;
        
        // Get record counts
        const recordCounts = await this.getRecordCounts(options.tenantId);
        
        // Update backup snapshot
        await db.update(backupSnapshots)
          .set({
            status: 'completed',
            completedAt: new Date(),
            storageLocation: finalPath,
            sizeBytes,
            checksum,
            recordCount: recordCounts,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          })
          .where({ id: snapshot.id });
        
        console.log('✅ Backup completed successfully!');
        console.log(`📁 Location: ${finalPath}`);
        console.log(`📊 Size: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🔒 Checksum: ${checksum}`);
        console.log(`📋 Records: ${JSON.stringify(recordCounts, null, 2)}`);
        
        return {
          snapshotId: snapshot.id,
          path: finalPath,
          size: sizeBytes,
          checksum,
          recordCounts
        };
        
      } catch (error) {
        // Update backup snapshot as failed
        await db.update(backupSnapshots)
          .set({
            status: 'failed',
            completedAt: new Date(),
            metadata: {
              ...snapshot.metadata,
              error: error.message
            }
          })
          .where({ id: snapshot.id });
        
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  }

  private buildFullBackupCommand(backupPath: string): string {
    return `pg_dump "${this.databaseUrl}" ` +
           `--verbose ` +
           `--no-owner ` +
           `--no-privileges ` +
           `--format=plain ` +
           `--file="${backupPath}.sql"`;
  }

  private buildTenantBackupCommand(backupPath: string, tenantId: string): string {
    // This would create a tenant-specific backup with RLS filtering
    // For now, we'll create a full backup and add tenant filtering in the future
    return this.buildFullBackupCommand(backupPath);
  }

  private async getRecordCounts(tenantId?: string): Promise<Record<string, number>> {
    const tables = [
      'tenants', 'users', 'artists', 'artist_profiles', 'projects', 
      'bookings', 'booking_events', 'availability_patterns', 'project_phases',
      'job_listings', 'job_applications', 'saved_jobs', 'notification_queue',
      'data_version_history', 'backup_snapshots', 'audit_log'
    ];
    
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        let query = `SELECT COUNT(*) as count FROM ${table}`;
        
        // Add tenant filter for tenant-specific tables
        if (tenantId && ['users', 'artists', 'projects', 'bookings', 'job_listings'].includes(table)) {
          query += ` WHERE tenant_id = '${tenantId}'`;
        }
        
        const result = await db.execute(query);
        counts[table] = parseInt(result[0]?.count || '0');
      } catch (error) {
        console.warn(`Warning: Could not count table ${table}:`, error.message);
        counts[table] = 0;
      }
    }
    
    return counts;
  }

  async restoreBackup(backupPath: string, options: { dropFirst?: boolean } = {}) {
    console.log(`🔄 Starting database restore from: ${backupPath}`);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database restore is not allowed in production without explicit confirmation!');
    }
    
    try {
      // Verify backup file exists
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }
      
      // Decompress if needed
      let sqlPath = backupPath;
      if (backupPath.endsWith('.gz')) {
        console.log('📂 Decompressing backup...');
        sqlPath = backupPath.replace('.gz', '');
        execSync(`gunzip -c "${backupPath}" > "${sqlPath}"`);
      }
      
      // Drop database if requested
      if (options.dropFirst) {
        console.log('🗑️  Dropping existing database...');
        // This would require connecting to a different database first
        // For safety, we'll just clear tables instead
        await this.clearDatabase();
      }
      
      // Restore from backup
      console.log('⏳ Restoring database...');
      const restoreCommand = `psql "${this.databaseUrl}" -f "${sqlPath}"`;
      execSync(restoreCommand, { stdio: 'inherit' });
      
      console.log('✅ Database restore completed successfully!');
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  private async clearDatabase() {
    await connectToDatabase();
    
    try {
      // Disable triggers temporarily
      await db.execute('SET session_replication_role = replica;');
      
      // Truncate all tables
      const tables = [
        'backup_snapshots', 'data_version_history', 'notification_queue',
        'saved_jobs', 'job_applications', 'job_listings', 'audit_log',
        'cache_invalidation', 'project_phases', 'availability_patterns',
        'booking_events', 'bookings', 'artist_profiles', 'artists',
        'projects', 'users', 'tenants'
      ];
      
      for (const table of tables) {
        try {
          await db.execute(`TRUNCATE TABLE ${table} CASCADE`);
        } catch (error) {
          console.warn(`Warning: Could not truncate table ${table}:`, error.message);
        }
      }
      
      // Re-enable triggers
      await db.execute('SET session_replication_role = DEFAULT;');
      
    } finally {
      await disconnectFromDatabase();
    }
  }

  async listBackups() {
    await connectToDatabase();
    
    try {
      const backups = await db.select()
        .from(backupSnapshots)
        .orderBy(desc(backupSnapshots.startedAt))
        .limit(20);
      
      console.log('\n📋 Recent Backups:');
      console.log('=' .repeat(80));
      
      for (const backup of backups) {
        const size = backup.sizeBytes ? (backup.sizeBytes / 1024 / 1024).toFixed(2) : 'N/A';
        console.log(`ID: ${backup.id}`);
        console.log(`Type: ${backup.snapshotType}`);
        console.log(`Status: ${backup.status}`);
        console.log(`Started: ${backup.startedAt}`);
        console.log(`Size: ${size} MB`);
        console.log(`Location: ${backup.storageLocation || 'N/A'}`);
        console.log('-'.repeat(40));
      }
      
    } finally {
      await disconnectFromDatabase();
    }
  }
}

async function main() {
  const command = process.argv[2];
  const backup = new DatabaseBackup();
  
  try {
    switch (command) {
      case 'create':
        const type = process.argv[3] as 'full' | 'tenant' || 'full';
        const tenantId = process.argv[4];
        await backup.createBackup({ 
          type, 
          tenantId, 
          compression: true 
        });
        break;
        
      case 'restore':
        const backupPath = process.argv[3];
        if (!backupPath) {
          throw new Error('Backup path is required for restore');
        }
        await backup.restoreBackup(backupPath, { dropFirst: true });
        break;
        
      case 'list':
        await backup.listBackups();
        break;
        
      default:
        console.log('Usage:');
        console.log('  npm run db:backup create [full|tenant] [tenant-id]');
        console.log('  npm run db:backup restore <backup-path>');
        console.log('  npm run db:backup list');
        break;
    }
    
  } catch (error) {
    console.error('❌ Backup operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseBackup };