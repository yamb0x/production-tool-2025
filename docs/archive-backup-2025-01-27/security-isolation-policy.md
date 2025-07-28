# Security Isolation Policy - Production Tool 2.0

## Overview
This document defines the security isolation policies for the multi-tenant Production Tool 2.0 platform. The core principle is complete data isolation between tenants (studios) with no super admin access across tenants.

## Core Principles

### 1. No Super Admin Access
- **NO** global super admin accounts that can access all tenant data
- **NO** backdoor access for developers or support staff
- **EACH** studio is completely isolated from others
- **ONLY** explicit permissions grant access to data

### 2. Tenant Isolation
- Each studio (tenant) has completely isolated data
- Cross-tenant queries are blocked at the database level
- All API endpoints enforce tenant context
- WebSocket connections are tenant-scoped

### 3. Zero Trust Architecture
- Verify every request
- Validate tenant context on every operation
- No implicit trust between services
- Audit all access attempts

## Implementation Strategy

### Database Level Isolation

#### Row-Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation ON artists
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON projects
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Continue for all tables...
```

#### GIST Constraints
```sql
-- Prevent cross-tenant booking conflicts
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
ADD CONSTRAINT no_double_booking
EXCLUDE USING GIST (
  artist_id WITH =,
  tenant_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (status IN ('confirmed', 'pencil'));
```

### Application Level Isolation

#### NestJS Guards
```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('No tenant context');
    }
    
    // Set tenant context for this request
    request.tenantId = user.tenantId;
    
    // Set for database queries
    AsyncLocalStorage.run({ tenantId: user.tenantId }, () => {
      // Request continues with tenant context
    });
    
    return true;
  }
}

// tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    
    // Ensure all database queries include tenant filter
    return next.handle().pipe(
      map(data => {
        // Verify response data belongs to tenant
        if (Array.isArray(data)) {
          return data.filter(item => item.tenantId === tenantId);
        }
        if (data && data.tenantId && data.tenantId !== tenantId) {
          throw new ForbiddenException('Access denied');
        }
        return data;
      }),
    );
  }
}
```

#### Repository Pattern Enforcement
```typescript
// base.repository.ts
export abstract class TenantScopedRepository<T> {
  constructor(
    private readonly db: DatabaseService,
    private readonly tableName: string,
  ) {}
  
  protected getTenantId(): string {
    const tenantId = AsyncLocalStorage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context available');
    }
    return tenantId;
  }
  
  async findAll(filters?: any): Promise<T[]> {
    return this.db
      .select()
      .from(this.tableName)
      .where({
        ...filters,
        tenant_id: this.getTenantId(), // Always include tenant filter
      });
  }
  
  async findOne(id: string): Promise<T | null> {
    return this.db
      .select()
      .from(this.tableName)
      .where({
        id,
        tenant_id: this.getTenantId(), // Always include tenant filter
      })
      .first();
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.db
      .insert({
        ...data,
        tenant_id: this.getTenantId(), // Always set tenant
      })
      .into(this.tableName)
      .returning('*')
      .first();
  }
}
```

### API Security

#### Request Validation
```typescript
// All controllers must use these guards
@Controller('artists')
@UseGuards(JwtAuthGuard, TenantGuard)
@UseInterceptors(TenantInterceptor)
export class ArtistController {
  // All endpoints automatically tenant-scoped
}
```

#### Cross-Origin Resource Sharing (CORS)
```typescript
// Strict CORS per tenant
app.enableCors({
  origin: (origin, callback) => {
    // Validate origin belongs to tenant
    const tenant = getTenantFromOrigin(origin);
    if (tenant) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

### WebSocket Security

#### Socket.IO Namespace Isolation
```typescript
@WebSocketGateway({
  namespace: (socket) => {
    // Dynamic namespace per tenant
    const tenantId = socket.handshake.auth.tenantId;
    return `/tenant/${tenantId}`;
  },
})
export class BookingGateway {
  @SubscribeMessage('join-tenant')
  async handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    // Verify user belongs to tenant
    const user = await this.validateUser(client);
    if (user.tenantId !== data.tenantId) {
      client.disconnect();
      return;
    }
    
    // Join tenant-specific rooms only
    client.join(`tenant:${data.tenantId}`);
  }
}
```

### Authentication & Authorization

#### JWT Token Structure
```typescript
interface JwtPayload {
  sub: string;          // User ID
  email: string;
  tenantId: string;     // Tenant context
  role: UserRole;       // Role within tenant
  iat: number;
  exp: number;
}
```

#### Role-Based Access Control (RBAC)
```typescript
export enum UserRole {
  OWNER = 'owner',       // Full tenant admin
  MANAGER = 'manager',   // Limited admin
  MEMBER = 'member',     // Regular user
  FREELANCER = 'freelancer', // External artist
}

// Permissions are tenant-scoped
@SetMetadata('roles', [UserRole.OWNER, UserRole.MANAGER])
@UseGuards(RolesGuard)
async deleteArtist() {
  // Only tenant owners/managers can delete
}
```

### Data Access Patterns

#### Safe Query Patterns
```typescript
// GOOD: Always include tenant context
const bookings = await this.bookingRepository.find({
  where: {
    tenantId: request.tenantId,
    artistId: artistId,
  },
});

// BAD: Never query without tenant context
const bookings = await this.bookingRepository.find({
  where: {
    artistId: artistId, // Missing tenant filter!
  },
});
```

#### Cross-Tenant Features
For features that need cross-tenant visibility (like public job listings):

```typescript
// Explicit opt-in for public data
@Public() // Decorator to bypass tenant guard
@Get('public-jobs')
async getPublicJobs() {
  return this.jobRepository.find({
    where: {
      status: 'open',
      visibility: 'public', // Explicit public flag
    },
    select: {
      // Limited fields for public view
      id: true,
      title: true,
      description: true,
      // No sensitive data
    },
  });
}
```

### Audit & Compliance

#### Comprehensive Audit Logging
```typescript
@Injectable()
export class AuditService {
  async logAccess(event: {
    userId: string;
    tenantId: string;
    resource: string;
    action: string;
    result: 'success' | 'denied';
    metadata?: any;
  }) {
    await this.auditRepository.create({
      ...event,
      timestamp: new Date(),
      ipAddress: this.getClientIp(),
      userAgent: this.getUserAgent(),
    });
  }
}
```

#### Security Monitoring
- Failed access attempts trigger alerts
- Cross-tenant access attempts are logged and investigated
- Unusual patterns trigger security reviews
- Regular security audits of access logs

### Backup & Recovery

#### Tenant-Scoped Backups
```typescript
// Backups are per-tenant, not global
async backupTenant(tenantId: string) {
  const tables = ['artists', 'projects', 'bookings', ...];
  
  for (const table of tables) {
    const data = await this.db
      .select()
      .from(table)
      .where({ tenant_id: tenantId });
      
    await this.storageService.save(
      `backups/${tenantId}/${table}/${timestamp}.json`,
      data,
    );
  }
}
```

### Testing Security Isolation

#### Integration Tests
```typescript
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Create data for tenant A
    const tenantA = await createTenant('Studio A');
    const artistA = await createArtist({ tenantId: tenantA.id });
    
    // Create user for tenant B
    const tenantB = await createTenant('Studio B');
    const userB = await createUser({ tenantId: tenantB.id });
    
    // Try to access tenant A's data as tenant B user
    const response = await request(app)
      .get(`/artists/${artistA.id}`)
      .set('Authorization', `Bearer ${userB.token}`);
      
    expect(response.status).toBe(404); // Not found, not forbidden
  });
});
```

### Security Checklist

#### For Every New Feature
- [ ] Tenant context validated at controller level
- [ ] Repository queries include tenant filter
- [ ] Response data verified for tenant ownership
- [ ] WebSocket events scoped to tenant namespace
- [ ] Audit logging implemented
- [ ] Integration tests verify isolation
- [ ] No global admin access possible
- [ ] Cross-tenant features explicitly marked

#### Regular Security Reviews
- [ ] Monthly audit log analysis
- [ ] Quarterly penetration testing
- [ ] Annual third-party security audit
- [ ] Continuous monitoring for anomalies

### Incident Response

#### Data Breach Protocol
1. Immediate isolation of affected tenant
2. Notification to affected tenant only
3. No access to other tenant data for investigation
4. Forensic analysis limited to affected tenant
5. Remediation without affecting other tenants

#### Access Violation Response
1. Automatic account suspension
2. Security team notification
3. Audit trail preservation
4. Investigation within tenant bounds
5. Report to tenant administrator

## Summary

The security isolation policy ensures:
- Complete data isolation between tenants
- No super admin access across tenants
- Every request is validated for tenant context
- Comprehensive audit logging
- Defense in depth at multiple layers
- Zero trust architecture throughout

This approach provides maximum security and privacy for each studio while maintaining system integrity and preventing any unauthorized cross-tenant access.