import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface VersionHistoryEntry {
  tenantId: string;
  tableName: string;
  recordId: string;
  version: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  delta?: any;
  userId?: string;
  reason?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
    tags?: string[];
  };
}

@Injectable()
export class DataVersionHistoryService {
  constructor(
    @InjectRepository('data_version_history')
    private readonly versionHistoryRepository: Repository<any>,
  ) {}

  async recordChange(entry: VersionHistoryEntry): Promise<void> {
    await this.versionHistoryRepository.save({
      ...entry,
      createdAt: new Date(),
    });
  }

  async getCurrentVersion(
    tableName: string,
    recordId: string,
  ): Promise<number> {
    const result = await this.versionHistoryRepository
      .createQueryBuilder('vh')
      .select('MAX(vh.version)', 'maxVersion')
      .where('vh.tableName = :tableName', { tableName })
      .andWhere('vh.recordId = :recordId', { recordId })
      .getRawOne();

    return result?.maxVersion || 0;
  }

  async getHistory(
    tableName: string,
    recordId: string,
    limit = 50,
  ): Promise<VersionHistoryEntry[]> {
    return this.versionHistoryRepository.find({
      where: {
        tableName,
        recordId,
      },
      order: {
        version: 'DESC',
      },
      take: limit,
    });
  }

  async getHistoryByTenant(
    tenantId: string,
    options: {
      tableName?: string;
      startDate?: Date;
      endDate?: Date;
      operation?: string;
      limit?: number;
    } = {},
  ): Promise<VersionHistoryEntry[]> {
    const query = this.versionHistoryRepository
      .createQueryBuilder('vh')
      .where('vh.tenantId = :tenantId', { tenantId });

    if (options.tableName) {
      query.andWhere('vh.tableName = :tableName', { tableName: options.tableName });
    }

    if (options.startDate) {
      query.andWhere('vh.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      query.andWhere('vh.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (options.operation) {
      query.andWhere('vh.operation = :operation', { operation: options.operation });
    }

    query.orderBy('vh.createdAt', 'DESC');

    if (options.limit) {
      query.limit(options.limit);
    }

    return query.getMany();
  }

  async restoreVersion(
    tableName: string,
    recordId: string,
    targetVersion: number,
    userId: string,
    reason: string,
  ): Promise<any> {
    // Get the target version data
    const versionEntry = await this.versionHistoryRepository.findOne({
      where: {
        tableName,
        recordId,
        version: targetVersion,
      },
    });

    if (!versionEntry) {
      throw new Error(`Version ${targetVersion} not found for ${tableName}:${recordId}`);
    }

    // Record the restore operation
    const currentVersion = await this.getCurrentVersion(tableName, recordId);
    await this.recordChange({
      tenantId: versionEntry.tenantId,
      tableName,
      recordId,
      version: currentVersion + 1,
      operation: 'UPDATE',
      data: versionEntry.data,
      userId,
      reason: `Restored to version ${targetVersion}: ${reason}`,
      metadata: {
        source: 'version_restore',
        tags: ['restore', `from_v${targetVersion}`],
      },
    });

    return versionEntry.data;
  }

  async compareVersions(
    tableName: string,
    recordId: string,
    version1: number,
    version2: number,
  ): Promise<{
    version1: VersionHistoryEntry;
    version2: VersionHistoryEntry;
    differences: any;
  }> {
    const [v1, v2] = await Promise.all([
      this.versionHistoryRepository.findOne({
        where: { tableName, recordId, version: version1 },
      }),
      this.versionHistoryRepository.findOne({
        where: { tableName, recordId, version: version2 },
      }),
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const differences = this.calculateDifferences(v1.data, v2.data);

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  }

  private calculateDifferences(obj1: any, obj2: any): any {
    const differences: any = {};

    // Find changed and removed fields
    for (const key in obj1) {
      if (!(key in obj2)) {
        differences[key] = { removed: obj1[key] };
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences[key] = {
          old: obj1[key],
          new: obj2[key],
        };
      }
    }

    // Find added fields
    for (const key in obj2) {
      if (!(key in obj1)) {
        differences[key] = { added: obj2[key] };
      }
    }

    return differences;
  }

  async pruneOldVersions(
    retentionDays: number,
    keepMinVersions = 5,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Get records that have more than minimum versions
    const recordsWithVersions = await this.versionHistoryRepository
      .createQueryBuilder('vh')
      .select('vh.tableName', 'tableName')
      .addSelect('vh.recordId', 'recordId')
      .addSelect('COUNT(*)', 'versionCount')
      .groupBy('vh.tableName')
      .addGroupBy('vh.recordId')
      .having('COUNT(*) > :minVersions', { minVersions: keepMinVersions })
      .getRawMany();

    let deletedCount = 0;

    for (const record of recordsWithVersions) {
      // Keep the most recent versions
      const versionsToKeep = await this.versionHistoryRepository
        .createQueryBuilder('vh')
        .select('vh.id')
        .where('vh.tableName = :tableName', { tableName: record.tableName })
        .andWhere('vh.recordId = :recordId', { recordId: record.recordId })
        .orderBy('vh.version', 'DESC')
        .limit(keepMinVersions)
        .getMany();

      const keepIds = versionsToKeep.map(v => v.id);

      // Delete old versions
      const result = await this.versionHistoryRepository
        .createQueryBuilder()
        .delete()
        .where('tableName = :tableName', { tableName: record.tableName })
        .andWhere('recordId = :recordId', { recordId: record.recordId })
        .andWhere('createdAt < :cutoffDate', { cutoffDate })
        .andWhere('id NOT IN (:...keepIds)', { keepIds })
        .execute();

      deletedCount += result.affected || 0;
    }

    return deletedCount;
  }
}