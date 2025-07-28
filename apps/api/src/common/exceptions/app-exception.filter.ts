import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log error with context
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.error.code === 'VALIDATION_ERROR' ? 400 : this.getHttpStatus(exception))
      .json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const correlationId = request.headers['x-correlation-id'] as string;

    // Handle different exception types
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, { timestamp, path, method, correlationId });
    }

    if (exception instanceof ZodError) {
      return this.handleZodError(exception, { timestamp, path, method, correlationId });
    }

    if (exception instanceof Error) {
      return this.handleGenericError(exception, { timestamp, path, method, correlationId });
    }

    // Unknown exception type
    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: String(exception),
      },
      timestamp,
      path,
      method,
      correlationId,
    };
  }

  private handleHttpException(
    exception: HttpException,
    context: { timestamp: string; path: string; method: string; correlationId?: string }
  ): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse();
    
    let errorCode = 'HTTP_ERROR';
    let message = exception.message;
    let details: any;

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      errorCode = responseObj.error || this.getErrorCodeFromStatus(status);
      message = responseObj.message || Array.isArray(responseObj.message) 
        ? responseObj.message.join(', ') 
        : responseObj.message || message;
      details = responseObj.details;
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        ...(process.env.NODE_ENV !== 'production' && { stack: exception.stack }),
      },
      ...context,
    };
  }

  private handleZodError(
    exception: ZodError,
    context: { timestamp: string; path: string; method: string; correlationId?: string }
  ): ErrorResponse {
    const details = exception.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      received: error.received,
    }));

    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      ...context,
    };
  }

  private handleGenericError(
    exception: Error,
    context: { timestamp: string; path: string; method: string; correlationId?: string }
  ): ErrorResponse {
    // Check for specific error types
    if (exception.name === 'DatabaseError' || exception.message.includes('connect ECONNREFUSED')) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
          details: process.env.NODE_ENV !== 'production' ? exception.message : undefined,
        },
        ...context,
      };
    }

    if (exception.name === 'UnauthorizedError' || exception.message.includes('Unauthorized')) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        ...context,
      };
    }

    if (exception.name === 'ForbiddenError' || exception.message.includes('Forbidden')) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
        ...context,
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal server error occurred' 
          : exception.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: exception.stack }),
      },
      ...context,
    };
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return statusMap[status] || 'HTTP_ERROR';
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { method, url, headers, body } = request;
    const userAgent = headers['user-agent'];
    const correlationId = headers['x-correlation-id'];
    
    const logContext = {
      correlationId,
      method,
      url,
      userAgent,
      errorCode: errorResponse.error.code,
      statusCode: this.getHttpStatus(exception),
      ...(process.env.NODE_ENV !== 'production' && { requestBody: body }),
    };

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      // Client errors (4xx) - log as warning
      this.logger.warn(`Client error: ${errorResponse.error.message}`, {
        ...logContext,
        exception: exception.message,
      });
    } else {
      // Server errors (5xx) and unknown errors - log as error
      this.logger.error(`Server error: ${errorResponse.error.message}`, {
        ...logContext,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }
  }
}