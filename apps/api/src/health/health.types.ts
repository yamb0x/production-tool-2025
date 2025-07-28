export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: DatabaseHealthResult;
    redis: RedisHealthResult;
    system: SystemHealthResult;
  };
  metrics: {
    httpRequests: number;
    wsConnections: number;
    activeUsers: number;
    databaseQueries: number;
    errors: number;
  };
}

export interface DatabaseHealthResult {
  status: HealthStatus;
  responseTime: number;
  details: {
    connectionPool?: {
      total: number;
      active: number;
      idle: number;
    };
    complexQueryTime?: number;
    version?: string;
    error?: string;
  };
  message: string;
}

export interface RedisHealthResult {
  status: HealthStatus;
  responseTime: number;
  details: {
    memory?: Record<string, string>;
    connectedClients?: number;
    error?: string;
  };
  message: string;
}

export interface SystemHealthResult {
  status: HealthStatus;
  details: {
    memory?: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    heap?: {
      used: number;
      total: number;
      usagePercent: number;
    };
    cpu?: {
      user: number;
      system: number;
      loadAverage: number[];
    };
    process?: {
      pid: number;
      uptime: number;
      version: string;
      platform: string;
      arch: string;
    };
    error?: string;
  };
  message: string;
}