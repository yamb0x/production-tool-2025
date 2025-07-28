# Production Tool 2.0 - Complete Architecture Guide

## Project Overview

**Production Tool 2.0** is an artist booking and project management platform for creative studios. It provides conflict-free scheduling, real-time collaboration, and comprehensive project tracking with enterprise-grade security and scalability.

### Key Features
- **Artist Booking System**: PostgreSQL GIST constraints prevent double-bookings
- **Real-time Collaboration**: Socket.IO with Redis for instant updates
- **Project Management**: Multi-phase projects with budget tracking
- **Multi-tenant Architecture**: Complete data isolation between studios
- **Event-driven Design**: Complete audit trail with event sourcing

## Technology Stack

### Core Technologies
| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Frontend** | Next.js | 15.x | SSR/SSG, App Router, React 19 |
| **Backend** | NestJS | 10.x | Enterprise patterns, TypeScript-first |
| **Database** | PostgreSQL | 15.x | GIST constraints, ACID compliance |
| **ORM** | Drizzle | Latest | Type-safe, performance-focused |
| **Real-time** | Socket.IO | 4.x | Mature WebSocket abstraction |
| **Auth** | Clerk | Latest | Enterprise auth, multi-tenant ready |
| **State** | Zustand | 4.x | Minimal boilerplate, TypeScript-first |
| **UI** | Shadcn/ui | Latest | Accessible, customizable components |
| **Cache** | Redis | 7.x | Session storage, pub/sub |

### Deployment Stack
| Service | Platform | Purpose |
|---------|----------|---------|
| **Frontend** | Vercel | Optimal Next.js deployment |
| **Backend** | Railway/DigitalOcean | Container deployment |
| **Database** | Neon | Serverless PostgreSQL |
| **Cache** | Redis Cloud | Managed Redis |
| **Monitoring** | Vercel Analytics + Custom | Performance tracking |

## Architecture Patterns

### 1. Separated Frontend/Backend (TDR-011)
```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│   Frontend      │ ──────────────► │    Backend      │
│   (Next.js)     │                 │   (NestJS)      │
│   Port: 3000    │ ◄────────────── │   Port: 8000    │
└─────────────────┘                 └─────────────────┘
                                            │
                                            ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │   (Neon)        │
                                    └─────────────────┘
```

**Benefits:**
- Independent scaling and deployment
- Technology flexibility per layer
- Clear separation of concerns
- Better caching strategies

### 2. Modular Monolith Structure
```
apps/
├── web/                    # Next.js frontend application
│   ├── app/               # App Router pages
│   ├── components/        # React components by feature
│   └── lib/              # Frontend utilities
├── api/                   # NestJS backend application
│   ├── src/modules/      # Domain modules
│   └── src/common/       # Shared backend code
└── mobile/               # Future React Native app

packages/
├── shared-types/         # Shared TypeScript types
├── ui/                   # Shared UI components
├── database/            # Database schema and migrations
└── config/              # Shared configuration
```

### 3. Multi-Tenant Architecture
```sql
-- Row-Level Security for tenant isolation
CREATE POLICY tenant_isolation ON bookings
FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

**Tenant Context Flow:**
1. JWT contains tenant ID
2. Middleware extracts tenant context
3. RLS policies enforce data isolation
4. All queries scoped to tenant

### 4. Event-Driven Architecture
```typescript
// Event sourcing pattern
interface BookingEvent {
  id: string;
  aggregateId: string;
  type: 'BookingCreated' | 'BookingConfirmed' | 'BookingCancelled';
  payload: any;
  version: number;
  timestamp: Date;
  tenantId: string;
}

// Event handlers for real-time updates
@EventHandler('BookingCreated')
async handleBookingCreated(event: BookingCreatedEvent) {
  // Emit to all clients in tenant room
  this.socketGateway.emitToTenant(event.tenantId, 'booking:created', event);
  // Update read models
  await this.updateBookingView(event);
}
```

## Database Design

### Core Schema
```sql
-- Artists with availability tracking
CREATE TABLE artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  specialties text[],
  hourly_rate numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings with GIST conflict prevention
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  artist_id uuid NOT NULL REFERENCES artists(id),
  project_id uuid REFERENCES projects(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status booking_status NOT NULL DEFAULT 'hold',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent double bookings using GIST exclusion
  CONSTRAINT no_double_booking 
  EXCLUDE USING gist (
    tenant_id WITH =,
    artist_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status IN ('confirmed', 'pencil'))
);

-- Projects with budget tracking
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  client text,
  budget numeric(12,2),
  status project_status DEFAULT 'planning',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- Event sourcing for audit trail
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  version integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);
```

### Performance Optimization
```sql
-- Composite indexes for efficient queries
CREATE INDEX idx_bookings_artist_time ON bookings (tenant_id, artist_id, start_time);
CREATE INDEX idx_bookings_project ON bookings (tenant_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_events_aggregate ON events (tenant_id, aggregate_id, version);

-- Partial indexes for active bookings
CREATE INDEX idx_active_bookings ON bookings (tenant_id, start_time) 
WHERE status IN ('confirmed', 'pencil') AND end_time > now();
```

## API Design

### RESTful Endpoints
```
/api/v1/
├── auth/                 # Authentication endpoints
├── artists/              # Artist management
│   ├── GET /            # List artists
│   ├── POST /           # Create artist
│   ├── GET /:id         # Get artist details
│   ├── PUT /:id         # Update artist
│   └── DELETE /:id      # Soft delete artist
├── bookings/            # Booking management
│   ├── GET /            # List bookings (with filters)
│   ├── POST /           # Create booking
│   ├── GET /:id         # Get booking details
│   ├── PUT /:id         # Update booking
│   ├── DELETE /:id      # Cancel booking
│   └── POST /:id/confirm # Confirm hold/pencil
├── projects/            # Project management
└── ws/                  # WebSocket connection
```

### WebSocket Events
```typescript
// Client → Server events
interface ClientEvents {
  'booking:create': (data: CreateBookingDto) => void;
  'booking:update': (id: string, data: UpdateBookingDto) => void;
  'booking:cancel': (id: string) => void;
  'join-tenant': (tenantId: string) => void;
}

// Server → Client events
interface ServerEvents {
  'booking:created': (booking: Booking) => void;
  'booking:updated': (booking: Booking) => void;
  'booking:cancelled': (bookingId: string) => void;
  'booking:conflict': (conflict: BookingConflict) => void;
}
```

## Security Architecture

### Zero-Trust Security Model
```typescript
// No super admin access - all access is scoped to tenants
interface SecurityPrinciples {
  noSuperAdmin: true;          // No global admin access
  zeroTrust: true;            // Verify every request
  tenantIsolation: true;      // Complete data separation
  principleOfLeastAccess: true; // Minimal permissions
}

// Role-based access control
enum UserRole {
  OWNER = 'owner',           // Full tenant access
  ADMIN = 'admin',           // Tenant management
  MANAGER = 'manager',       // Project management
  ARTIST = 'artist',         // Self-service booking
  VIEWER = 'viewer'          // Read-only access
}
```

### Authentication Flow
```
1. User authenticates with Clerk
2. JWT token contains tenant_id and role
3. API middleware validates token and extracts context
4. RLS policies enforce tenant isolation
5. RBAC checks permissions for specific operations
```

### Data Protection
- **Encryption**: AES-256 for sensitive data at rest
- **TLS 1.3**: All connections encrypted in transit
- **Input Validation**: Zod schemas for type safety
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: Content Security Policy headers

## Real-time Architecture

### Socket.IO Implementation
```typescript
// WebSocket Gateway with tenant isolation
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/api/ws'
})
export class BookingGateway {
  @WebSocketServer() server: Server;
  
  @SubscribeMessage('join-tenant')
  async handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string }
  ) {
    // Verify user has access to tenant
    await this.verifyTenantAccess(client, data.tenantId);
    
    // Join tenant-specific room
    await client.join(`tenant:${data.tenantId}`);
  }
  
  async broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}
```

### Redis Pub/Sub for Scaling
```typescript
// Multi-server coordination
export class RedisAdapter {
  constructor(private redis: Redis) {}
  
  async publishEvent(tenantId: string, event: string, data: any) {
    await this.redis.publish(
      `tenant:${tenantId}`,
      JSON.stringify({ event, data })
    );
  }
  
  async subscribeToTenant(tenantId: string, handler: EventHandler) {
    await this.redis.subscribe(`tenant:${tenantId}`);
    this.redis.on('message', (channel, message) => {
      if (channel === `tenant:${tenantId}`) {
        const { event, data } = JSON.parse(message);
        handler(event, data);
      }
    });
  }
}
```

## Backup & Recovery Strategy

### Multi-Layer Backup Approach
```yaml
# Complete backup strategy
backup_layers:
  - name: "Version History"
    scope: "Every change tracked in database"
    retention: "Indefinite"
    recovery_time: "Instant (query-based)"
    
  - name: "Point-in-Time Recovery (PITR)"
    scope: "Database state at any moment"
    retention: "30 days"
    recovery_time: "5-10 minutes"
    
  - name: "Daily Snapshots"
    scope: "Complete database backup"
    retention: "90 days"
    recovery_time: "15-30 minutes"
    
  - name: "Tenant Export"
    scope: "Per-tenant data export"
    retention: "On-demand"
    recovery_time: "Immediate download"
```

### Version History Implementation
```sql
-- Track every change with full context
CREATE TABLE data_version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL, -- INSERT, UPDATE, DELETE
  old_data jsonb,          -- Previous state (NULL for INSERT)
  new_data jsonb,          -- New state (NULL for DELETE)
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  change_reason text
);

-- Trigger function for automatic version tracking
CREATE OR REPLACE FUNCTION track_version_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_version_history (
    tenant_id, table_name, record_id, operation,
    old_data, new_data, changed_by
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END,
    current_setting('app.current_user_id', true)::uuid
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Recovery Procedures
```typescript
// Instant version rollback
async rollbackToVersion(
  tenantId: string,
  tableId: string,
  recordId: string,
  versionTimestamp: Date
) {
  const version = await this.getVersionAtTimestamp(
    tenantId, tableId, recordId, versionTimestamp
  );
  
  if (version) {
    await this.restoreRecord(tableId, recordId, version.data);
    await this.logRecoveryAction(tenantId, 'version_rollback', {
      recordId, timestamp: versionTimestamp
    });
  }
}

// Point-in-time recovery
async pointInTimeRecovery(targetTimestamp: Date) {
  // Coordinate with Neon's PITR feature
  const recoveryPoint = await this.neonClient.createRecoveryPoint(
    targetTimestamp
  );
  
  return {
    recoveryPoint,
    estimatedTime: '5-10 minutes',
    dataLoss: this.calculateDataLoss(targetTimestamp)
  };
}
```

## Frontend Architecture

### Next.js App Router Structure
```
apps/web/
├── app/                    # App Router
│   ├── (dashboard)/       # Route groups
│   │   ├── bookings/     # Booking management
│   │   ├── artists/      # Artist profiles
│   │   └── projects/     # Project tracking
│   ├── api/              # API routes (proxies to backend)
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API client setup
│   ├── auth.ts          # Clerk configuration
│   └── socket.ts        # Socket.IO client
└── hooks/                # Custom React hooks
```

### State Management Strategy
```typescript
// Zustand store for global state
interface AppState {
  // Authentication
  user: User | null;
  tenant: Tenant | null;
  
  // Booking state
  bookings: Booking[];
  selectedBooking: Booking | null;
  
  // UI state
  isLoading: boolean;
  errors: Record<string, string>;
  
  // Actions
  setUser: (user: User) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
}

// React Query for server state
const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => api.bookings.list(filters),
    staleTime: 30000, // 30 seconds
  });
};

// Real-time updates via Socket.IO
const useRealtimeBookings = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    socket.on('booking:created', (booking) => {
      queryClient.setQueryData(['bookings'], (old: Booking[]) => 
        [...(old || []), booking]
      );
    });
    
    socket.on('booking:updated', (booking) => {
      queryClient.setQueryData(['bookings'], (old: Booking[]) =>
        old?.map(b => b.id === booking.id ? booking : b) || []
      );
    });
    
    return () => {
      socket.off('booking:created');
      socket.off('booking:updated');
    };
  }, [queryClient]);
};
```

## Testing Strategy

### Testing Pyramid
```
                    /\
                   /  \
                  / E2E \     ← Few, high-value tests
                 /______\
                /        \
               /Integration\ ← API contracts, DB constraints
              /__________\
             /            \
            /    Unit      \ ← Many, fast tests
           /________________\
```

### Testing Implementation
```typescript
// Unit tests for business logic
describe('BookingService', () => {
  it('should prevent double booking', async () => {
    const service = new BookingService(mockRepo);
    
    await service.createBooking({
      artistId: 'artist1',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T12:00:00Z'),
      status: 'confirmed'
    });
    
    await expect(
      service.createBooking({
        artistId: 'artist1',
        startTime: new Date('2025-01-01T11:00:00Z'),
        endTime: new Date('2025-01-01T13:00:00Z'),
        status: 'confirmed'
      })
    ).rejects.toThrow('Booking conflict detected');
  });
});

// Integration tests for API endpoints
describe('Booking API', () => {
  it('should create booking and emit real-time event', async () => {
    const response = await request(app)
      .post('/api/v1/bookings')
      .send(validBookingData)
      .expect(201);
    
    expect(response.body).toMatchObject({
      id: expect.any(String),
      status: 'hold'
    });
    
    // Verify WebSocket event was emitted
    expect(mockSocketGateway.broadcastToTenant).toHaveBeenCalledWith(
      'tenant1',
      'booking:created',
      expect.objectContaining({ id: response.body.id })
    );
  });
});

// E2E tests for critical workflows
describe('Booking Workflow', () => {
  it('should complete full booking lifecycle', async () => {
    await page.goto('/bookings');
    
    // Create hold booking
    await page.click('[data-testid="create-booking"]');
    await page.fill('[data-testid="artist-select"]', 'John Doe');
    await page.fill('[data-testid="start-time"]', '2025-01-01T10:00');
    await page.fill('[data-testid="end-time"]', '2025-01-01T12:00');
    await page.click('[data-testid="create-hold"]');
    
    // Verify hold created
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('Hold');
    
    // Confirm booking
    await page.click('[data-testid="confirm-booking"]');
    
    // Verify confirmation
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('Confirmed');
  });
});
```

## Performance Optimization

### Database Performance
```sql
-- Optimized queries with proper indexing
EXPLAIN (ANALYZE, BUFFERS) 
SELECT b.*, a.name as artist_name 
FROM bookings b 
JOIN artists a ON b.artist_id = a.id 
WHERE b.tenant_id = $1 
  AND b.start_time >= $2 
  AND b.start_time <= $3 
ORDER BY b.start_time;

-- Query plan should use index scan, not sequential scan
-- Index Scan using idx_bookings_tenant_time_range
```

### Caching Strategy
```typescript
// Multi-layer caching
export class CacheService {
  constructor(
    private redis: Redis,
    private memoryCache: NodeCache
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    let value = this.memoryCache.get<T>(key);
    if (value !== undefined) return value;
    
    // L2: Redis cache
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      value = JSON.parse(redisValue);
      this.memoryCache.set(key, value, 300); // 5 min TTL
      return value;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    // Set in both caches
    this.memoryCache.set(key, value, ttl);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}

// Cache invalidation on updates
@EventHandler('BookingUpdated')
async handleBookingUpdated(event: BookingUpdatedEvent) {
  // Invalidate related caches
  await this.cacheService.delete(`bookings:tenant:${event.tenantId}`);
  await this.cacheService.delete(`artist:availability:${event.artistId}`);
}
```

### Frontend Performance
```typescript
// React optimization patterns
const BookingList = memo(({ bookings }: { bookings: Booking[] }) => {
  // Virtualize large lists
  return (
    <FixedSizeList
      height={600}
      itemCount={bookings.length}
      itemSize={80}
      itemData={bookings}
    >
      {BookingRow}
    </FixedSizeList>
  );
});

// Optimistic updates for better UX
const useOptimisticBookings = () => {
  const [optimisticBookings, setOptimisticBookings] = useState<Booking[]>([]);
  const { data: bookings, mutate } = useBookings();
  
  const createBooking = async (bookingData: CreateBookingData) => {
    // Optimistic update
    const tempBooking = { ...bookingData, id: generateTempId(), status: 'creating' };
    setOptimisticBookings(prev => [...prev, tempBooking]);
    
    try {
      const newBooking = await api.bookings.create(bookingData);
      setOptimisticBookings(prev => prev.filter(b => b.id !== tempBooking.id));
      mutate(); // Revalidate server state
    } catch (error) {
      setOptimisticBookings(prev => prev.filter(b => b.id !== tempBooking.id));
      throw error;
    }
  };
  
  return {
    bookings: [...(bookings || []), ...optimisticBookings],
    createBooking
  };
};
```

## Deployment & DevOps

### Development Environment
```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: production_tool_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/production_tool_dev
      REDIS_URL: redis://redis:6379
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
  
  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - api
```

### Production Deployment
```yaml
# Deployment configuration
production:
  frontend:
    platform: Vercel
    auto_deploy: true
    edge_functions: true
    environment_variables:
      NEXT_PUBLIC_API_URL: https://api.productiontool.com
      NEXT_PUBLIC_WS_URL: wss://api.productiontool.com/ws
  
  backend:
    platform: Railway
    auto_deploy: true
    scaling:
      min_instances: 1
      max_instances: 10
      cpu_threshold: 70%
    environment_variables:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      REDIS_URL: ${{ secrets.REDIS_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
  
  database:
    platform: Neon
    features:
      point_in_time_recovery: true
      connection_pooling: true
      read_replicas: 2
    backup_retention: 30_days
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run type-check
      - run: pnpm run lint
      - run: pnpm run test:unit
      - run: pnpm run test:integration
      - run: pnpm run build
  
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Monitoring & Observability

### Application Monitoring
```typescript
// Custom metrics collection
export class MetricsService {
  private prometheus = new PrometheusRegistry();
  
  private bookingMetrics = {
    createdTotal: new Counter({
      name: 'bookings_created_total',
      help: 'Total number of bookings created',
      labelNames: ['tenant_id', 'status'] as const,
    }),
    
    conflictRate: new Gauge({
      name: 'booking_conflict_rate',
      help: 'Rate of booking conflicts per tenant',
      labelNames: ['tenant_id'] as const,
    }),
    
    responseTime: new Histogram({
      name: 'api_response_time_seconds',
      help: 'API response time in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
    })
  };
  
  recordBookingCreated(tenantId: string, status: BookingStatus) {
    this.bookingMetrics.createdTotal.inc({ tenant_id: tenantId, status });
  }
  
  recordApiCall(method: string, route: string, statusCode: number, duration: number) {
    this.bookingMetrics.responseTime
      .labels({ method, route, status_code: statusCode.toString() })
      .observe(duration / 1000);
  }
}

// Health checks
@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        external_apis: await this.checkExternalAPIs()
      },
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkDatabase(): Promise<CheckResult> {
    try {
      await this.db.raw('SELECT 1');
      return { status: 'healthy', response_time: 'N/A' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
```

### Error Tracking & Alerting
```typescript
// Structured error handling
export class ErrorService {
  constructor(private logger: Logger) {}
  
  captureError(error: Error, context: ErrorContext) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: {
        tenantId: context.tenantId,
        userId: context.userId,
        operation: context.operation,
        timestamp: new Date().toISOString()
      }
    };
    
    // Log structured error
    this.logger.error('Application error', errorData);
    
    // Send to external monitoring
    this.sendToMonitoring(errorData);
    
    // Alert on critical errors
    if (this.isCriticalError(error)) {
      this.sendAlert(errorData);
    }
  }
  
  private isCriticalError(error: Error): boolean {
    return error.message.includes('database') ||
           error.message.includes('authentication') ||
           error.name === 'BookingConflictError';
  }
}
```

## Security Compliance

### Data Protection
```typescript
// GDPR compliance features
export class DataProtectionService {
  // Right to access
  async exportUserData(userId: string, tenantId: string): Promise<UserDataExport> {
    const userData = await this.gatherUserData(userId, tenantId);
    return {
      personal_info: userData.profile,
      bookings: userData.bookings,
      projects: userData.projects,
      audit_log: userData.activities,
      exported_at: new Date().toISOString()
    };
  }
  
  // Right to be forgotten
  async deleteUserData(userId: string, tenantId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Anonymize instead of delete to preserve booking integrity
      await this.anonymizeBookings(userId, tenantId, trx);
      await this.deletePersonalData(userId, tenantId, trx);
      await this.logDataDeletion(userId, tenantId, trx);
    });
  }
  
  // Data retention policies
  async applyRetentionPolicies(): Promise<void> {
    // Delete old audit logs (7 years retention)
    await this.deleteOldAuditLogs(7);
    
    // Archive completed projects (5 years retention)
    await this.archiveOldProjects(5);
    
    // Clean up expired holds (24 hours)
    await this.cleanupExpiredHolds();
  }
}
```

### Audit Trail
```sql
-- Comprehensive audit logging
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Trigger for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    tenant_id, user_id, action, resource_type, resource_id,
    old_values, new_values, ip_address
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    current_setting('app.current_user_id', true)::uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    current_setting('app.client_ip', true)::inet
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## Future Roadmap

### Phase 1: Core Platform (Months 1-3)
- ✅ Database schema and constraints
- ✅ Authentication and multi-tenancy
- ✅ Basic booking system
- ⏳ Real-time updates
- ⏳ Project management
- ⏳ Frontend UI components

### Phase 2: Enhanced Features (Months 4-6)
- Artist profiles and portfolios
- Advanced project workflows
- Reporting and analytics
- Mobile app (React Native)
- Advanced notifications

### Phase 3: Enterprise Features (Months 7-12)
- API integrations (calendar, accounting)
- Advanced analytics and BI
- Custom workflows
- White-label solutions
- Marketplace features

### Technical Evolution
```
Current: Modular Monolith
    ↓
   If needed: Selective Microservices
    ↓
   Future: Event-driven Microservices
```

## Conclusion

Production Tool 2.0's architecture balances immediate needs with future scalability. The separated frontend/backend design enables independent scaling, while the modular monolith approach provides development velocity for a small team.

Key architectural strengths:
- **Database-level conflict prevention** ensures data integrity
- **Multi-tenant architecture** provides complete customer isolation
- **Event-driven design** enables real-time features and audit trails
- **Type-safe development** reduces bugs and improves velocity
- **Comprehensive backup strategy** ensures business continuity
- **Zero-trust security** protects sensitive business data

The platform is designed to grow from a 2-person team tool to an enterprise-grade solution, with clear migration paths for each scaling challenge.

---

*Last updated: January 27, 2025*  
*Architecture version: 5.0 (Consolidated)*