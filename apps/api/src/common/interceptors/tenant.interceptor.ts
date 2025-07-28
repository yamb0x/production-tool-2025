import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    
    if (!tenantId) {
      throw new ForbiddenException('Tenant context not found');
    }
    
    return next.handle().pipe(
      map(data => {
        // Verify response data belongs to tenant
        if (data === null || data === undefined) {
          return data;
        }
        
        // Handle arrays
        if (Array.isArray(data)) {
          return data.filter(item => {
            if (item && typeof item === 'object' && 'tenantId' in item) {
              return item.tenantId === tenantId;
            }
            return true; // Allow items without tenantId (like counts, etc.)
          });
        }
        
        // Handle paginated responses
        if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.filter(item => {
              if (item && typeof item === 'object' && 'tenantId' in item) {
                return item.tenantId === tenantId;
              }
              return true;
            }),
          };
        }
        
        // Handle single objects
        if (data && typeof data === 'object' && 'tenantId' in data) {
          if (data.tenantId !== tenantId) {
            throw new ForbiddenException('Access denied to this resource');
          }
        }
        
        return data;
      }),
    );
  }
}