import { Controller, Get, HttpStatus, Injectable } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { 
  HealthCheckResult, 
  DatabaseHealthResult, 
  RedisHealthResult, 
  SystemHealthResult 
} from './health.types';

@ApiTags('Health')
@Controller('health')
@Injectable()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Returns basic application health status'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-27T12:00:00.000Z' },
        uptime: { type: 'number', example: 3600 }
      }
    }
  })
  async check(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Returns comprehensive health status including dependencies'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed health information',
    type: HealthCheckResult
  })
  async detailed(): Promise<HealthCheckResult> {
    return this.healthService.getDetailedHealth();
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe - checks if app is ready to receive traffic'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is ready'
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Application is not ready'
  })
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const isReady = await this.healthService.isReady();
    
    if (!isReady) {
      throw new Error('Application not ready');
    }

    return {
      status: 'ready',
      ready: true
    };
  }

  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe - checks if app is alive and should be restarted'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is alive'
  })
  async liveness(): Promise<{ status: string; alive: boolean }> {
    const isAlive = await this.healthService.isAlive();
    
    if (!isAlive) {
      throw new Error('Application not alive');
    }

    return {
      status: 'alive',
      alive: true
    };
  }

  @Get('database')
  @ApiOperation({
    summary: 'Database health check',
    description: 'Checks database connectivity and performance'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database health information',
    type: DatabaseHealthResult
  })
  async database(): Promise<DatabaseHealthResult> {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({
    summary: 'Redis health check',
    description: 'Checks Redis connectivity and performance'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Redis health information',
    type: RedisHealthResult
  })
  async redis(): Promise<RedisHealthResult> {
    return this.healthService.checkRedis();
  }

  @Get('system')
  @ApiOperation({
    summary: 'System health check',
    description: 'Checks system resources and performance metrics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health information',
    type: SystemHealthResult
  })
  async system(): Promise<SystemHealthResult> {
    return this.healthService.checkSystem();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Application metrics',
    description: 'Returns application performance metrics for monitoring'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application metrics in Prometheus format',
    schema: {
      type: 'string',
      example: '# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",status="200"} 100'
    }
  })
  async metrics(): Promise<string> {
    return this.healthService.getMetrics();
  }
}