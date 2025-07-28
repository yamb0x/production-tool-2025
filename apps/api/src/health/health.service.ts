import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DrizzleDatabase } from '../common/types/drizzle.types';
import { Redis } from 'ioredis';
import { sql } from 'drizzle-orm';
import * as os from 'os';
import * as process from 'process';
import { 
  HealthCheckResult, 
  DatabaseHealthResult, 
  RedisHealthResult, 
  SystemHealthResult,
  HealthStatus 
} from './health.types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime = Date.now();
  private metrics = {
    httpRequests: 0,
    wsConnections: 0,
    activeUsers: 0,
    databaseQueries: 0,
    errors: 0
  };

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleDatabase,
    @Inject('REDIS_CONNECTION') private readonly redis: Redis
  ) {}

  async getDetailedHealth(): Promise<HealthCheckResult> {
    const [database, redis, system] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkSystem()
    ]);

    const dbResult = database.status === 'fulfilled' ? database.value : this.createErrorResult('Database check failed', database.reason);
    const redisResult = redis.status === 'fulfilled' ? redis.value : this.createErrorResult('Redis check failed', redis.reason);
    const systemResult = system.status === 'fulfilled' ? system.value : this.createErrorResult('System check failed', system.reason);

    const overallStatus = this.calculateOverallStatus([
      dbResult.status,
      redisResult.status,
      systemResult.status
    ]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Date.now() - this.startTime,
      checks: {
        database: dbResult,
        redis: redisResult,
        system: systemResult
      },
      metrics: {
        httpRequests: this.metrics.httpRequests,
        wsConnections: this.metrics.wsConnections,
        activeUsers: this.metrics.activeUsers,
        databaseQueries: this.metrics.databaseQueries,
        errors: this.metrics.errors
      }
    };
  }

  async isReady(): Promise<boolean> {
    try {
      // Check critical dependencies
      const [dbHealthy, redisHealthy] = await Promise.all([
        this.isDatabaseHealthy(),
        this.isRedisHealthy()
      ]);

      return dbHealthy && redisHealthy;
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      return false;
    }
  }

  async isAlive(): Promise<boolean> {
    try {
      // Basic liveness check - app can respond
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
      
      // Consider app dead if using more than 1GB heap
      if (heapUsed > 1024) {
        this.logger.warn(`High memory usage detected: ${heapUsed.toFixed(2)}MB`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Liveness check failed', error);
      return false;
    }
  }

  async checkDatabase(): Promise<DatabaseHealthResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.db.execute(sql`SELECT 1 as test`);
      const responseTime = Date.now() - startTime;

      // Test connection pool
      const poolStats = await this.getDatabasePoolStats();
      
      // Test a more complex query
      const complexQueryStart = Date.now();
      await this.db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del
        FROM pg_stat_user_tables 
        LIMIT 5
      `);
      const complexQueryTime = Date.now() - complexQueryStart;

      const status: HealthStatus = responseTime > 1000 ? 'degraded' : 'healthy';

      return {
        status,
        responseTime,
        details: {
          connectionPool: poolStats,
          complexQueryTime,
          version: await this.getDatabaseVersion()
        },
        message: status === 'healthy' ? 'Database is healthy' : 'Database response is slow'
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        },
        message: 'Database connection failed'
      };
    }
  }

  async checkRedis(): Promise<RedisHealthResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const pong = await this.redis.ping();
      const responseTime = Date.now() - startTime;

      if (pong !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      // Test read/write operations
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      await this.redis.set(testKey, testValue, 'EX', 60); // Expire in 60 seconds
      const retrievedValue = await this.redis.get(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      // Get Redis info
      const info = await this.redis.info('memory');
      const memoryInfo = this.parseRedisInfo(info);

      const status: HealthStatus = responseTime > 500 ? 'degraded' : 'healthy';

      return {
        status,
        responseTime,
        details: {
          memory: memoryInfo,
          connectedClients: await this.getRedisConnectedClients()
        },
        message: status === 'healthy' ? 'Redis is healthy' : 'Redis response is slow'
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        },
        message: 'Redis connection failed'
      };
    }
  }

  async checkSystem(): Promise<SystemHealthResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAverage = os.loadavg();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();

      const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Determine system health status
      let status: HealthStatus = 'healthy';
      if (memoryUsagePercent > 90 || heapUsagePercent > 90 || loadAverage[0] > os.cpus().length * 2) {
        status = 'unhealthy';
      } else if (memoryUsagePercent > 80 || heapUsagePercent > 80 || loadAverage[0] > os.cpus().length) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          memory: {
            total: Math.round(totalMemory / 1024 / 1024), // MB
            free: Math.round(freeMemory / 1024 / 1024), // MB
            used: Math.round((totalMemory - freeMemory) / 1024 / 1024), // MB
            usagePercent: Math.round(memoryUsagePercent * 100) / 100
          },
          heap: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            usagePercent: Math.round(heapUsagePercent * 100) / 100
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            loadAverage: loadAverage.map(load => Math.round(load * 100) / 100)
          },
          process: {
            pid: process.pid,
            uptime: Math.round(process.uptime()),
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        },
        message: this.getSystemStatusMessage(status, memoryUsagePercent, heapUsagePercent, loadAverage[0])
      };
    } catch (error) {
      this.logger.error('System health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        },
        message: 'System health check failed'
      };
    }
  }

  getMetrics(): string {
    const metricsOutput = [
      '# HELP http_requests_total Total HTTP requests',
      '# TYPE http_requests_total counter',
      `http_requests_total ${this.metrics.httpRequests}`,
      '',
      '# HELP websocket_connections_active Active WebSocket connections',
      '# TYPE websocket_connections_active gauge',
      `websocket_connections_active ${this.metrics.wsConnections}`,
      '',
      '# HELP active_users_total Active users',
      '# TYPE active_users_total gauge',
      `active_users_total ${this.metrics.activeUsers}`,
      '',
      '# HELP database_queries_total Total database queries',
      '# TYPE database_queries_total counter',
      `database_queries_total ${this.metrics.databaseQueries}`,
      '',
      '# HELP errors_total Total errors',
      '# TYPE errors_total counter',
      `errors_total ${this.metrics.errors}`,
      '',
      '# HELP app_uptime_seconds Application uptime in seconds',
      '# TYPE app_uptime_seconds gauge',
      `app_uptime_seconds ${Math.round((Date.now() - this.startTime) / 1000)}`,
    ].join('\n');

    return metricsOutput;
  }

  // Metric tracking methods
  incrementHttpRequests(): void {
    this.metrics.httpRequests++;
  }

  setWebSocketConnections(count: number): void {
    this.metrics.wsConnections = count;
  }

  setActiveUsers(count: number): void {
    this.metrics.activeUsers = count;
  }

  incrementDatabaseQueries(): void {
    this.metrics.databaseQueries++;
  }

  incrementErrors(): void {
    this.metrics.errors++;
  }

  // Private helper methods
  private async isDatabaseHealthy(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  private async isRedisHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  private calculateOverallStatus(statuses: HealthStatus[]): HealthStatus {
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }

  private createErrorResult(message: string, error: any): any {
    return {
      status: 'unhealthy' as HealthStatus,
      responseTime: 0,
      details: { error: error?.message || 'Unknown error' },
      message
    };
  }

  private async getDatabasePoolStats(): Promise<any> {
    try {
      // This would need to be implemented based on your connection pool
      return {
        total: 20,
        active: 2,
        idle: 18
      };
    } catch {
      return { error: 'Could not retrieve pool stats' };
    }
  }

  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.db.execute(sql`SELECT version()`);
      return result[0]?.version || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const memoryInfo: any = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.includes('memory')) {
          memoryInfo[key] = value;
        }
      }
    });
    
    return memoryInfo;
  }

  private async getRedisConnectedClients(): Promise<number> {
    try {
      const info = await this.redis.info('clients');
      const match = info.match(/connected_clients:(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  private getSystemStatusMessage(
    status: HealthStatus, 
    memoryPercent: number, 
    heapPercent: number, 
    loadAvg: number
  ): string {
    if (status === 'healthy') {
      return 'System is healthy';
    } else if (status === 'degraded') {
      return `System is degraded - Memory: ${memoryPercent.toFixed(1)}%, Heap: ${heapPercent.toFixed(1)}%, Load: ${loadAvg.toFixed(2)}`;
    } else {
      return `System is unhealthy - Memory: ${memoryPercent.toFixed(1)}%, Heap: ${heapPercent.toFixed(1)}%, Load: ${loadAvg.toFixed(2)}`;
    }
  }
}