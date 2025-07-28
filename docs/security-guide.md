# Production Tool 2.0 - Security Implementation Guide

## Security Architecture Overview

Production Tool 2.0 implements a **zero-trust security model** with complete tenant isolation, ensuring no super admin access and comprehensive data protection.

### Core Security Principles
1. **Zero-Trust Architecture**: Verify every request, trust nothing by default
2. **Complete Tenant Isolation**: No cross-tenant data access possible
3. **No Super Admin Access**: All access is scoped to specific tenants
4. **Defense in Depth**: Multiple security layers for comprehensive protection
5. **Principle of Least Privilege**: Minimal permissions for each role

## Authentication & Authorization

### Clerk Integration
```typescript
// Authentication setup with Clerk
export const authMiddleware = clerkMiddleware({
  publicRoutes: ['/api/health', '/api/webhooks/clerk'],
  ignoredRoutes: ['/api/webhooks/(.*)'],
});

// JWT token structure
interface ClerkJWT {
  sub: string;          // User ID
  tenant_id: string;    // Tenant isolation
  role: UserRole;       // Role-based permissions
  permissions: string[]; // Granular permissions
  iat: number;          // Issued at
  exp: number;          // Expires at
}
```

### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  OWNER = 'owner',        // Full tenant access + billing
  ADMIN = 'admin',        // Tenant management (no billing)
  MANAGER = 'manager',    // Project management + team oversight
  ARTIST = 'artist',      // Self-service booking + profile
  VIEWER = 'viewer'       // Read-only access
}

// Permission matrix
const PERMISSIONS = {
  // Booking permissions
  'booking:create': ['owner', 'admin', 'manager'],
  'booking:update': ['owner', 'admin', 'manager'],
  'booking:delete': ['owner', 'admin', 'manager'],
  'booking:view': ['owner', 'admin', 'manager', 'artist', 'viewer'],
  'booking:view:own': ['artist'], // Artists can only see their own bookings
  
  // Project permissions
  'project:create': ['owner', 'admin', 'manager'],
  'project:update': ['owner', 'admin', 'manager'],
  'project:delete': ['owner', 'admin'],
  'project:view': ['owner', 'admin', 'manager', 'viewer'],
  
  // Admin permissions
  'tenant:manage': ['owner'],
  'billing:view': ['owner'],
  'users:invite': ['owner', 'admin'],
  'users:manage': ['owner', 'admin'],
  
  // Artist profile permissions
  'profile:update:own': ['artist'], // Artists can update their own profile
  'profile:view:all': ['owner', 'admin', 'manager']
} as const;

// Permission checking utility
export const hasPermission = (
  userRole: UserRole, 
  permission: keyof typeof PERMISSIONS,
  resourceOwnerId?: string,
  currentUserId?: string
): boolean => {
  const allowedRoles = PERMISSIONS[permission];
  
  // Check if user role is allowed
  if (!allowedRoles.includes(userRole)) {
    // Special case: own resource access
    if (permission.endsWith(':own') && resourceOwnerId === currentUserId) {
      return true;
    }
    return false;
  }
  
  return true;
};
```

### JWT Token Validation
```typescript
// Middleware for JWT validation
export const validateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token with Clerk
    const payload = await verifyToken(token);
    
    // Extract tenant context
    const tenantId = payload.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Invalid token: missing tenant' });
    }
    
    // Set request context
    req.user = {
      id: payload.sub,
      tenantId,
      role: payload.role,
      permissions: payload.permissions
    };
    
    // Set tenant context for RLS
    await setTenantContext(tenantId);
    
    next();
  } catch (error) {
    logger.error('JWT validation failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Set tenant context for Row-Level Security
const setTenantContext = async (tenantId: string) => {
  await db.execute(sql`
    SET app.current_tenant_id = ${tenantId}
  `);
};
```

## Multi-Tenant Data Isolation

### Row-Level Security (RLS) Implementation
```sql
-- Enable RLS on all tenant-specific tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy - users can only access their tenant's data
CREATE POLICY tenant_isolation ON bookings
FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON artists
FOR ALL TO authenticated  
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON projects
FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- User access policy - users can only access users in their tenant
CREATE POLICY tenant_user_access ON users
FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Tenant access policy - users can only access their own tenant
CREATE POLICY own_tenant_access ON tenants
FOR ALL TO authenticated
USING (id = current_setting('app.current_tenant_id')::uuid);
```

### Database Security Functions
```sql
-- Function to get current tenant ID from JWT context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify user belongs to tenant
CREATE OR REPLACE FUNCTION verify_tenant_access(user_id uuid, tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND users.tenant_id = verify_tenant_access.tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  
  -- Verify tenant access
  IF NOT verify_tenant_access(
    current_setting('app.current_user_id')::uuid,
    NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid tenant';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
```

## Data Protection & Encryption

### Encryption at Rest
```typescript
// Sensitive data encryption using AES-256
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  static encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted
    };
  }
  
  static decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from('additional-data'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage for sensitive fields
@Entity()
export class Artist {
  @Column()
  name: string;
  
  @Column({ transformer: {
    to: (value: string) => EncryptionService.encrypt(value),
    from: (value: EncryptedData) => EncryptionService.decrypt(value)
  }})
  email: string; // Encrypted in database
  
  @Column()
  tenant_id: string;
}
```

### TLS/SSL Configuration
```typescript
// Express.js HTTPS setup for production
import https from 'https';
import fs from 'fs';

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    // Enable strong cipher suites
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384', 
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    honorCipherOrder: true
  };
  
  https.createServer(options, app).listen(443);
} else {
  app.listen(8000); // HTTP for development
}
```

## Input Validation & Sanitization

### Zod Schema Validation
```typescript
// Comprehensive input validation with Zod
import { z } from 'zod';

// Booking validation schema
export const CreateBookingSchema = z.object({
  artistId: z.string().uuid('Invalid artist ID'),
  projectId: z.string().uuid('Invalid project ID').optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  notes: z.string().max(500, 'Notes too long').optional(),
  status: z.enum(['hold', 'pencil', 'confirmed']).default('hold')
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime']
  }
);

// Artist profile validation
export const ArtistProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters in name'),
  email: z.string().email('Invalid email format'),
  specialties: z.array(z.string()).max(10, 'Too many specialties'),
  hourlyRate: z.number()
    .min(0, 'Rate cannot be negative')
    .max(10000, 'Rate too high')
    .optional(),
  bio: z.string().max(1000, 'Bio too long').optional()
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Usage in routes
router.post('/bookings', 
  validateRequest(CreateBookingSchema),
  createBooking
);
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries with Drizzle
import { eq, and, gte, lte } from 'drizzle-orm';

// ✅ Safe: Parameterized query
export const getBookingsByArtist = async (artistId: string, tenantId: string) => {
  return await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.artistId, artistId),
        eq(bookings.tenantId, tenantId)
      )
    );
};

// ❌ Dangerous: String concatenation (never do this)
// const query = `SELECT * FROM bookings WHERE artist_id = '${artistId}'`;

// ✅ Safe: Complex queries with parameters
export const getBookingsInRange = async (
  tenantId: string,
  startDate: Date, 
  endDate: Date
) => {
  return await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        gte(bookings.startTime, startDate),
        lte(bookings.endTime, endDate)
      )
    );
};
```

### XSS Prevention
```typescript
// Content Security Policy headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://clerk.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Input sanitization for user content
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Use in API endpoints
router.put('/artists/:id', async (req, res) => {
  const { bio, ...otherData } = req.body;
  
  const sanitizedData = {
    ...otherData,
    bio: bio ? sanitizeHtml(bio) : undefined
  };
  
  // Update artist with sanitized data
  await updateArtist(req.params.id, sanitizedData);
});
```

## API Security

### Rate Limiting
```typescript
// Redis-based rate limiting
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyGenerator: (req) => {
    // Rate limit per user per tenant
    return `${req.user.tenantId}:${req.user.id}`;
  },
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if exceeded
});

// Strict rate limiting for sensitive endpoints
const strictRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyGenerator: (req) => req.user.id,
  points: 5, // Only 5 requests
  duration: 300, // Per 5 minutes
  blockDuration: 900, // Block for 15 minutes
});

// Apply rate limiting middleware
export const rateLimitMiddleware = (limiter: RateLimiterRedis) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req);
      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: secs 
      });
    }
  };
};

// Usage on routes
router.post('/bookings', 
  rateLimitMiddleware(rateLimiter),
  createBooking
);

router.post('/auth/login',
  rateLimitMiddleware(strictRateLimiter),
  login
);
```

### API Request Signing
```typescript
// HMAC-based request signing for critical operations
import crypto from 'crypto';

export class RequestSigner {
  private static secret = process.env.API_SIGNING_SECRET;
  
  static signRequest(payload: any, timestamp: number): string {
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto
      .createHmac('sha256', this.secret)
      .update(message)
      .digest('hex');
  }
  
  static verifySignature(
    payload: any,
    timestamp: number,
    signature: string
  ): boolean {
    const expectedSignature = this.signRequest(payload, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Middleware for signed requests
export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-signature'] as string;
  const timestamp = parseInt(req.headers['x-timestamp'] as string);
  
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing signature or timestamp' });
  }
  
  // Prevent replay attacks (5 minute window)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 300000) {
    return res.status(401).json({ error: 'Request expired' });
  }
  
  if (!RequestSigner.verifySignature(req.body, timestamp, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};

// Use for critical operations
router.delete('/bookings/:id',
  verifySignature,
  deleteBooking
);
```

## Audit Trail & Logging

### Comprehensive Audit Logging
```sql
-- Audit log table for security events
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
  session_id text,
  created_at timestamptz DEFAULT now(),
  
  -- Security classification
  security_level text CHECK (security_level IN ('low', 'medium', 'high', 'critical'))
);

-- Index for efficient querying
CREATE INDEX idx_audit_log_tenant_time ON audit_log (tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_security ON audit_log (security_level, created_at DESC);
```

```typescript
// Audit logging service
export class AuditLogger {
  static async logSecurityEvent(event: SecurityEvent) {
    await db.insert(auditLog).values({
      tenantId: event.tenantId,
      userId: event.userId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      oldValues: event.oldValues,
      newValues: event.newValues,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      securityLevel: event.securityLevel || 'medium'
    });
    
    // Alert on critical security events
    if (event.securityLevel === 'critical') {
      await this.sendSecurityAlert(event);
    }
  }
  
  private static async sendSecurityAlert(event: SecurityEvent) {
    // Send to monitoring service
    logger.error('Critical security event', {
      event,
      timestamp: new Date().toISOString()
    });
    
    // Could integrate with Slack, email, etc.
  }
}

// Audit middleware for automatic logging
export const auditMiddleware = (
  action: string,
  resourceType: string,
  securityLevel: SecurityLevel = 'medium'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after successful operation
      AuditLogger.logSecurityEvent({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        action,
        resourceType,
        resourceId: req.params.id,
        newValues: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        securityLevel
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Usage on sensitive routes
router.delete('/users/:id',
  auditMiddleware('user_deleted', 'user', 'high'),
  deleteUser
);

router.post('/bookings',
  auditMiddleware('booking_created', 'booking', 'medium'),
  createBooking
);
```

## Security Monitoring & Alerting

### Real-time Security Monitoring
```typescript
// Security monitoring service
export class SecurityMonitor {
  private static readonly ALERT_THRESHOLDS = {
    failedLogins: 5, // Failed logins per user per 15 minutes
    unusualActivity: 10, // Unusual API calls per user per minute
    suspiciousPatterns: 3 // Pattern-based detections
  };
  
  static async monitorFailedLogins(userId: string, tenantId: string) {
    const key = `failed_logins:${userId}`;
    const count = await redis.incr(key);
    await redis.expire(key, 900); // 15 minutes
    
    if (count >= this.ALERT_THRESHOLDS.failedLogins) {
      await this.triggerSecurityAlert({
        type: 'multiple_failed_logins',
        userId,
        tenantId,
        details: { attemptCount: count }
      });
      
      // Temporarily lock account
      await this.temporaryAccountLock(userId, 900); // 15 minutes
    }
  }
  
  static async detectUnusualActivity(req: Request) {
    const userId = req.user.id;
    const endpoint = req.route.path;
    const key = `activity:${userId}:${endpoint}`;
    
    const count = await redis.incr(key);
    await redis.expire(key, 60); // 1 minute window
    
    // Check if this is unusual for this user
    const historicalAverage = await this.getHistoricalAverage(userId, endpoint);
    
    if (count > historicalAverage * 3) { // 3x normal activity
      await this.triggerSecurityAlert({
        type: 'unusual_activity',
        userId,
        tenantId: req.user.tenantId,
        details: {
          endpoint,
          currentCount: count,
          historicalAverage
        }
      });
    }
  }
  
  private static async triggerSecurityAlert(alert: SecurityAlert) {
    // Log to audit trail
    await AuditLogger.logSecurityEvent({
      ...alert,
      action: 'security_alert_triggered',
      resourceType: 'security',
      securityLevel: 'critical'
    });
    
    // Send to monitoring system
    logger.error('Security alert triggered', alert);
    
    // Could integrate with external alerting systems
  }
}

// Security monitoring middleware
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Monitor for unusual activity patterns
  SecurityMonitor.detectUnusualActivity(req);
  
  next();
};
```

### Vulnerability Scanning
```typescript
// Automated dependency vulnerability checking
export class VulnerabilityScanner {
  static async scanDependencies() {
    const vulnerabilities = await this.runNpmAudit();
    
    const critical = vulnerabilities.filter(v => v.severity === 'critical');
    const high = vulnerabilities.filter(v => v.severity === 'high');
    
    if (critical.length > 0) {
      await this.alertCriticalVulnerabilities(critical);
    }
    
    return {
      total: vulnerabilities.length,
      critical: critical.length,
      high: high.length,
      vulnerabilities
    };
  }
  
  private static async runNpmAudit(): Promise<Vulnerability[]> {
    // Implementation would run npm audit and parse results
    // This is a simplified example
    return [];
  }
  
  private static async alertCriticalVulnerabilities(vulnerabilities: Vulnerability[]) {
    logger.error('Critical vulnerabilities detected', {
      count: vulnerabilities.length,
      vulnerabilities: vulnerabilities.map(v => ({
        package: v.package,
        severity: v.severity,
        cve: v.cve
      }))
    });
  }
}

// Schedule regular vulnerability scans
setInterval(async () => {
  await VulnerabilityScanner.scanDependencies();
}, 24 * 60 * 60 * 1000); // Daily
```

## Data Privacy & GDPR Compliance

### Data Export & Deletion
```typescript
// GDPR compliance service
export class DataPrivacyService {
  // Right to access - export all user data
  static async exportUserData(userId: string, tenantId: string): Promise<UserDataExport> {
    // Gather all user-related data
    const [profile, bookings, projects, auditLogs] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      db.select().from(bookings).where(eq(bookings.createdBy, userId)),
      db.select().from(projects).where(eq(projects.createdBy, userId)),
      db.select().from(auditLog).where(eq(auditLog.userId, userId))
    ]);
    
    return {
      personal_information: profile[0],
      booking_history: bookings,
      project_history: projects,
      activity_log: auditLogs,
      exported_at: new Date().toISOString(),
      export_format: 'JSON'
    };
  }
  
  // Right to be forgotten - delete user data
  static async deleteUserData(userId: string, tenantId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Anonymize bookings (preserve business records)
      await tx
        .update(bookings)
        .set({ 
          createdBy: null,
          notes: '[User data deleted]'
        })
        .where(eq(bookings.createdBy, userId));
      
      // 2. Delete personal profile data
      await tx
        .delete(users)
        .where(and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        ));
      
      // 3. Anonymize audit logs
      await tx
        .update(auditLog)
        .set({
          userId: null,
          userAgent: '[Deleted]',
          ipAddress: null
        })
        .where(eq(auditLog.userId, userId));
      
      // 4. Log the deletion
      await AuditLogger.logSecurityEvent({
        tenantId,
        userId: null,
        action: 'gdpr_data_deletion',
        resourceType: 'user',
        resourceId: userId,
        securityLevel: 'high'
      });
    });
  }
  
  // Data retention policy enforcement
  static async enforceRetentionPolicies(): Promise<void> {
    const retentionPeriods = {
      auditLogs: 7 * 365, // 7 years
      inactiveUsers: 3 * 365, // 3 years
      completedProjects: 5 * 365 // 5 years
    };
    
    // Delete old audit logs
    await db
      .delete(auditLog)
      .where(
        lte(auditLog.createdAt, new Date(Date.now() - retentionPeriods.auditLogs * 24 * 60 * 60 * 1000))
      );
    
    // Archive old completed projects
    const oldProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.status, 'completed'),
          lte(projects.updatedAt, new Date(Date.now() - retentionPeriods.completedProjects * 24 * 60 * 60 * 1000))
        )
      );
    
    for (const project of oldProjects) {
      await this.archiveProject(project);
    }
  }
}
```

## Security Configuration Checklist

### Production Security Checklist
```yaml
Environment:
  - [ ] All environment variables secured
  - [ ] No secrets in code or logs
  - [ ] HTTPS enforced everywhere
  - [ ] Security headers configured
  - [ ] CORS properly configured

Database:
  - [ ] RLS enabled on all tables
  - [ ] Strong database passwords
  - [ ] Connection encryption enabled
  - [ ] Regular backup verification
  - [ ] No direct database access

Authentication:
  - [ ] JWT secrets rotated regularly
  - [ ] Session timeouts configured
  - [ ] MFA available for admin users
  - [ ] Account lockout policies active
  - [ ] Password policies enforced

Authorization:
  - [ ] RBAC implemented correctly
  - [ ] Principle of least privilege
  - [ ] Regular permission audits
  - [ ] No hardcoded permissions
  - [ ] Tenant isolation verified

Monitoring:
  - [ ] Security event logging
  - [ ] Failed login monitoring
  - [ ] Unusual activity detection
  - [ ] Vulnerability scanning
  - [ ] Security alert system

Compliance:
  - [ ] GDPR data export ready
  - [ ] Data deletion procedures
  - [ ] Audit trail complete
  - [ ] Privacy policy updated
  - [ ] Data retention policies
```

### Security Testing
```typescript
// Security test suite
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.error).toContain('Invalid token');
    });
    
    it('should enforce rate limiting', async () => {
      const requests = Array(101).fill(null).map(() => 
        request(app).get('/api/bookings').set('Authorization', validToken)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
  
  describe('Authorization', () => {
    it('should prevent cross-tenant access', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', tenant1Token)
        .expect(200);
      
      // Should not contain any tenant2 bookings
      expect(response.body.every(b => b.tenantId === tenant1Id)).toBe(true);
    });
    
    it('should enforce RBAC permissions', async () => {
      await request(app)
        .delete('/api/users/123')
        .set('Authorization', viewerToken)
        .expect(403);
    });
  });
  
  describe('Input Validation', () => {
    it('should reject malicious SQL injection attempts', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', validToken)
        .send({
          artistId: "'; DROP TABLE bookings; --",
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T12:00:00Z'
        })
        .expect(400);
    });
    
    it('should sanitize XSS attempts', async () => {
      const response = await request(app)
        .post('/api/artists')
        .set('Authorization', validToken)
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@example.com'
        })
        .expect(201);
      
      expect(response.body.name).not.toContain('<script>');
    });
  });
});
```

---

*This security guide must be reviewed and updated regularly. Security is an ongoing process, not a one-time implementation.*