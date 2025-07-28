import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

// Create AsyncLocalStorage instance for tenant context
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('No tenant context available');
    }
    
    // Set tenant context for this request
    request.tenantId = user.tenantId;
    
    // Make tenant context available throughout the request lifecycle
    tenantContext.enterWith({ tenantId: user.tenantId });
    
    return true;
  }
}