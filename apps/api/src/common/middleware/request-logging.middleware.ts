import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, headers } = req;
    const startTime = Date.now();
    const correlationId = headers['x-correlation-id'];
    const userAgent = headers['user-agent'];
    const clientIp = this.getClientIp(req);

    // Log incoming request
    this.logger.log(`Incoming ${method} ${originalUrl}`, {
      correlationId,
      method,
      url: originalUrl,
      userAgent,
      clientIp,
      timestamp: new Date().toISOString(),
    });

    // Override response.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      
      // Determine log level based on status code
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      
      const logMessage = `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`;
      const logContext = {
        correlationId,
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        userAgent,
        clientIp,
        timestamp: new Date().toISOString(),
      };

      if (logLevel === 'error') {
        this.logger.error(logMessage, logContext);
      } else if (logLevel === 'warn') {
        this.logger.warn(logMessage, logContext);
      } else {
        this.logger.log(logMessage, logContext);
      }

      // Call original end method
      originalEnd.call(this, chunk, encoding, cb);
    }.bind(res);

    next();
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}