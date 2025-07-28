import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Check if correlation ID is already present in headers
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
    
    // Set correlation ID in request headers
    req.headers['x-correlation-id'] = correlationId;
    
    // Set correlation ID in response headers for client tracking
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  }
}