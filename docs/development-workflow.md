# Development Workflow Guide

## AI-Assisted Development Best Practices

This guide outlines the optimal workflow for developing Production Tool 2.0 using AI assistance, specialized agents, and modern development tools.

## Development Philosophy

### Core Principles
- **AI-First Development**: Leverage Claude Code and specialized agents for maximum productivity
- **Evidence-Based Decisions**: All architectural choices backed by testing and metrics
- **Documentation as context**: Keep documentation synchronized with implementation
- **Quality Gates**: Automated quality checks at every stage

## Tools and Stack

### Essential Development Tools

| Category | Tool | Purpose | Integration |
|----------|------|---------|-------------|
| **AI Assistant** | Claude Code | Primary development AI | SuperClaude framework |
| **IDE** | Cursor | Primary development environment | Extensions, settings |
| **Version Control** | Git + GitHub | Code versioning | Actions, PR automation |
| **Package Manager** | pnpm | Monorepo dependency management | Workspaces, caching |
| **Build System** | Turborepo | Monorepo build orchestration | Caching, parallelization |
| **Database** | PostgreSQL + Drizzle | Data layer | Type generation, migrations |
| **Testing** | Vitest + Playwright | Unit and E2E testing | CI/CD integration |
| **Design** | Figma | UI/UX design | MCP integration |
| **Deployment** | Vercel + Railway | Hosting platforms | Auto-deployment |

### AI Development Stack

```yaml
SuperClaude Framework:
  core_personas:
    - architect: System design and architecture decisions
    - frontend: UI/UX development with accessibility focus  
    - backend: API development and database optimization
    - security: Security implementation and threat modeling
    - analyzer: Code analysis and debugging
    - qa: Testing strategy and quality assurance
  
  specialized_agents:
    - booking-specialist: GIST constraints and booking logic
    - realtime-coordinator: Socket.IO and real-time features
    - api-architect: RESTful API design and documentation
    - database-engineer: PostgreSQL optimization and migrations
    - security-architect: Multi-tenant security and RLS
    - test-engineer: Comprehensive testing strategies
    - ui-specialist: React components and design systems

  mcp_servers:
    - context7: Framework documentation and patterns
    - sequential: Complex analysis and structured thinking
    - magic: UI component generation from designs
    - playwright: Browser automation and E2E testing
```

### VS Code Configuration

```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true
  }
}

// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "drizzle-team.drizzle-vscode"
  ]
}
```

## AI-Assisted Development Workflow

### 1. Feature Planning Phase
```bash
# Start with architectural analysis
claude-code "/analyze --focus architecture --scope project"

# Use specialized agents for domain-specific planning
claude-code "/task --delegate booking-specialist 'Plan new booking feature'"
claude-code "/task --delegate frontend 'Design UI components for feature'"
```

### 2. Implementation Workflow

#### A. Database Schema Changes
```typescript
// 1. Design schema with database-engineer agent
claude-code "/task --delegate database-engineer 'Design schema for [feature]'"

// 2. Generate migration
pnpm run db:generate

// 3. Review and apply migration
pnpm run db:migrate

// 4. Update types
pnpm run db:generate-types
```

#### B. Backend Development
```typescript
// 1. API design with api-architect
claude-code "/task --delegate api-architect 'Design API endpoints for [feature]'"

// 2. Implement with backend specialist
claude-code "/implement --focus backend [API endpoint details]"

// 3. Add tests
claude-code "/task --delegate test-engineer 'Create tests for [endpoint]'"
```

#### C. Frontend Development
```typescript
// 1. UI design analysis (if using Figma)
claude-code "/task --delegate ui-specialist 'Implement component from Figma design'"

// 2. Component development
claude-code "/implement --focus frontend [component specifications]"

// 3. Integration with backend
claude-code "/integrate [frontend component] with [backend API]"
```

### 3. Quality Assurance Workflow

#### A. Automated Testing
```bash
# Unit tests
pnpm run test:unit

# Integration tests  
pnpm run test:integration

# E2E tests with Playwright agent
claude-code "/task --delegate test-engineer 'Create E2E tests for [workflow]'"
pnpm run test:e2e

# Type checking
pnpm run type-check

# Linting and formatting
pnpm run lint
pnpm run lint:fix
```

#### B. Security Review
```bash
# Security analysis with security-architect
claude-code "/task --delegate security-architect 'Review security for [feature]'"

# Dependency vulnerability check
pnpm audit

# Code quality check
pnpm run quality-check
```

### 4. Documentation Workflow
```bash
# Generate API documentation
pnpm run docs:api

# Update architectural decisions
claude-code "/document [feature] architecture decisions"

# Update user-facing documentation
claude-code "/task --delegate scribe 'Document [feature] for users'"
```

## Monorepo Development Patterns

### Project Structure Navigation
```
production-tool-2025/
├── apps/
│   ├── web/           # Next.js frontend → Port 3000
│   ├── api/           # NestJS backend → Port 8000  
│   └── mobile/        # React Native (future)
├── packages/
│   ├── shared-types/  # Shared TypeScript types
│   ├── ui/            # Shared UI components
│   ├── database/      # Database schema and migrations
│   └── config/        # Shared configuration
├── docs/              # All documentation
├── scripts/           # Development and deployment scripts
└── tools/             # Build and development tools
```

### Development Commands
```bash
# Start all development servers
pnpm run dev

# Start specific app
pnpm run dev:web      # Frontend only
pnpm run dev:api      # Backend only

# Build all packages
pnpm run build

# Test all packages
pnpm run test

# Type check all packages
pnpm run type-check

# Lint all packages
pnpm run lint
```

### Package Dependencies
```json
// Managing dependencies in monorepo
{
  "dependencies": {
    // Shared dependencies in root package.json
    "typescript": "^5.3.0",
    "prettier": "^3.1.0",
    "eslint": "^8.56.0"
  }
}

// App-specific dependencies in app package.json
// apps/web/package.json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0",
    "@production-tool/shared-types": "workspace:*",
    "@production-tool/ui": "workspace:*"
  }
}
```

## Git Workflow and Automation

### Branch Strategy
```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/[name]     # Feature development
├── hotfix/[name]      # Production hotfixes
└── release/[version]  # Release preparation
```

### Commit Message Format
```bash
# Format: <type>(<scope>): <description>
feat(booking): add hold/pencil/confirmed workflow
fix(api): resolve booking conflict race condition
docs(architecture): update database schema documentation
test(booking): add integration tests for conflict prevention
refactor(frontend): improve booking form validation
```

### Automated Quality Checks
```yaml
# .github/workflows/quality.yml
name: Quality Checks
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm run type-check
      
      - name: Lint
        run: pnpm run lint
      
      - name: Unit tests
        run: pnpm run test:unit
      
      - name: Build
        run: pnpm run build
      
      - name: E2E tests
        run: pnpm run test:e2e
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## Database Development Workflow

### Schema Evolution Process
```bash
# 1. Design schema changes
claude-code "/task --delegate database-engineer 'Design schema for [feature]'"

# 2. Generate migration
pnpm run db:generate --name="add_[feature]_tables"

# 3. Review generated migration
cat drizzle/migrations/[timestamp]_add_[feature]_tables.sql

# 4. Test migration locally
pnpm run db:migrate

# 5. Update types
pnpm run db:generate-types

# 6. Test with new schema
pnpm run test:integration
```

### Migration Best Practices
```sql
-- Safe migration patterns

-- ✅ Good: Add nullable column
ALTER TABLE bookings ADD COLUMN notes TEXT;

-- ✅ Good: Add column with default
ALTER TABLE bookings ADD COLUMN priority INTEGER DEFAULT 1;

-- ❌ Avoid: Non-nullable column without default
-- ALTER TABLE bookings ADD COLUMN required_field TEXT NOT NULL;

-- ✅ Good: Multi-step migration for required fields
-- Step 1: Add nullable column
ALTER TABLE bookings ADD COLUMN required_field TEXT;
-- Step 2: Populate data
UPDATE bookings SET required_field = 'default_value' WHERE required_field IS NULL;
-- Step 3: Add not null constraint
ALTER TABLE bookings ALTER COLUMN required_field SET NOT NULL;
```

### Database Testing
```typescript
// Database integration tests
describe('Booking Repository', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should prevent double booking with GIST constraint', async () => {
    // Create first booking
    const booking1 = await bookingRepo.create({
      artistId: 'artist1',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T12:00:00Z'),
      status: 'confirmed'
    });

    // Attempt overlapping booking
    await expect(
      bookingRepo.create({
        artistId: 'artist1',
        startTime: new Date('2025-01-01T11:00:00Z'),
        endTime: new Date('2025-01-01T13:00:00Z'),
        status: 'confirmed'
      })
    ).rejects.toThrow('conflicting key value violates exclusion constraint');
  });
});
```

## Frontend Development Patterns

### Component Development Process
```bash
# 1. Analyze design requirements
claude-code "/task --delegate ui-specialist 'Analyze Figma design for [component]'"

# 2. Create component structure
claude-code "/implement --focus frontend [component] with accessibility"

# 3. Add Storybook stories
claude-code "/task --delegate frontend 'Create Storybook stories for [component]'"

# 4. Add tests
claude-code "/task --delegate test-engineer 'Create tests for [component]'"
```

### React Patterns
```typescript
// Feature-based component organization
src/components/
├── ui/                    # Base UI components (shadcn/ui)
├── forms/                # Form components
├── booking/              # Booking-specific components
│   ├── BookingForm.tsx
│   ├── BookingList.tsx
│   └── BookingCalendar.tsx
└── shared/               # Shared feature components

// Component composition pattern
export const BookingPage = () => {
  return (
    <PageLayout>
      <PageHeader title="Bookings" />
      <BookingFilters />
      <BookingList />
      <CreateBookingDialog />
    </PageLayout>
  );
};

// Custom hooks for data fetching
export const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => api.bookings.list(filters),
    staleTime: 30000,
  });
};

// Real-time data synchronization
export const useRealtimeBookings = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    socket.on('booking:created', (booking) => {
      queryClient.setQueryData(['bookings'], (old: Booking[]) => 
        [...(old || []), booking]
      );
    });
    
    return () => socket.off('booking:created');
  }, [queryClient]);
};
```

### Styling and Design System
```typescript
// Tailwind + CSS Variables approach
:root {
  --primary: 210 100% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 95%;
  --secondary-foreground: 222.2 84% 4.9%;
}

// Component styling patterns
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Real-time Development Patterns

### Socket.IO Implementation
```typescript
// Backend: WebSocket Gateway
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
    // Verify tenant access
    const hasAccess = await this.verifyTenantAccess(client, data.tenantId);
    if (!hasAccess) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }
    
    // Join tenant-specific room
    await client.join(`tenant:${data.tenantId}`);
    client.emit('joined', { tenantId: data.tenantId });
  }
  
  async broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}

// Frontend: Socket.IO client
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.tenantId) {
      const newSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}`, {
        auth: { token: user.token }
      });
      
      newSocket.emit('join-tenant', { tenantId: user.tenantId });
      setSocket(newSocket);
      
      return () => newSocket.close();
    }
  }, [user]);
  
  return socket;
};
```

## Testing Strategies

### Testing Pyramid Implementation
```typescript
// Unit Tests (70%)
describe('BookingService', () => {
  it('should validate booking time ranges', () => {
    const service = new BookingService();
    const result = service.validateTimeRange(
      new Date('2025-01-01T10:00:00Z'),
      new Date('2025-01-01T09:00:00Z') // End before start
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('End time must be after start time');
  });
});

// Integration Tests (20%)
describe('Booking API Integration', () => {
  it('should create booking and emit event', async () => {
    const response = await request(app)
      .post('/api/v1/bookings')
      .send(validBookingData)
      .expect(201);
    
    // Verify database state
    const booking = await bookingRepo.findById(response.body.id);
    expect(booking).toBeDefined();
    
    // Verify event was emitted
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'booking.created',
      expect.objectContaining({ id: response.body.id })
    );
  });
});

// E2E Tests (10%)
describe('Booking Workflow E2E', () => {
  it('should complete full booking lifecycle', async () => {
    await page.goto('/bookings');
    
    // Create booking
    await page.click('[data-testid="create-booking"]');
    await page.fill('[data-testid="artist-select"]', 'John Doe');
    // ... rest of test workflow
    
    // Verify booking appears in list
    await expect(page.locator('[data-testid="booking-list"]'))
      .toContainText('John Doe');
  });
});
```

### Test Data Management
```typescript
// Test factories for consistent test data
export const BookingFactory = {
  build: (overrides: Partial<Booking> = {}): Booking => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    artistId: faker.string.uuid(),
    startTime: faker.date.future(),
    endTime: faker.date.future(),
    status: 'hold',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  buildList: (count: number, overrides?: Partial<Booking>): Booking[] =>
    Array.from({ length: count }, () => BookingFactory.build(overrides))
};

// Database seeding for integration tests
export const seedTestData = async () => {
  const tenant = await tenantRepo.create({
    name: 'Test Studio',
    slug: 'test-studio'
  });
  
  const artist = await artistRepo.create({
    tenantId: tenant.id,
    name: 'Test Artist',
    email: 'test@example.com'
  });
  
  return { tenant, artist };
};
```

## Performance Optimization

### Development Performance
```bash
# Optimize Turborepo caching
pnpm run build --cache-dir=.turbo

# Optimize TypeScript compilation
pnpm run type-check --incremental

# Optimize test execution
pnpm run test --maxWorkers=50%

# Bundle analysis
pnpm run analyze:bundle
```

### Runtime Performance Monitoring
```typescript
// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      return () => observer.disconnect();
    }
  }, []);
};

// API performance tracking
export const trackApiPerformance = (endpoint: string, duration: number) => {
  if (duration > 1000) {
    console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
  }
  
  // Send to monitoring service
  analytics.track('api_performance', {
    endpoint,
    duration,
    timestamp: Date.now()
  });
};
```

## Debugging and Troubleshooting

### AI-Assisted Debugging
```bash
# Analyze error patterns
claude-code "/analyze --focus errors --scope recent"

# Get debugging assistance
claude-code "/troubleshoot [error description] --include-context"

# Performance analysis
claude-code "/analyze --focus performance --scope system"
```

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/main.ts",
      "cwd": "${workspaceFolder}/apps/api",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Logging Strategy
```typescript
// Structured logging
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// Context-aware logging
export const createContextLogger = (context: string) => {
  return logger.child({ context });
};

// Usage in services
const serviceLogger = createContextLogger('BookingService');
serviceLogger.info('Creating booking', { 
  artistId, 
  startTime, 
  endTime,
  tenantId 
});
```

## Deployment and Release Process

### Staging Environment
```bash
# Deploy to staging
git push origin develop

# Run staging tests
pnpm run test:staging

# Performance testing
pnpm run test:performance

# Security scanning
pnpm run security:scan
```

### Production Release
```bash
# Create release branch
git checkout -b release/v1.2.0

# Update version numbers
pnpm run version:bump

# Generate changelog
pnpm run changelog:generate

# Create pull request for review
gh pr create --title "Release v1.2.0" --body "$(cat CHANGELOG.md)"

# After approval, merge and tag
git tag v1.2.0
git push origin v1.2.0
```

### Feature Flags
```typescript
// Feature flag implementation
export const useFeatureFlag = (flag: string) => {
  const { user } = useAuth();
  
  return useMemo(() => {
    // Check user-specific flags
    if (user?.betaFeatures?.includes(flag)) {
      return true;
    }
    
    // Check environment flags
    if (process.env.NODE_ENV === 'development') {
      return process.env[`FEATURE_${flag.toUpperCase()}`] === 'true';
    }
    
    // Check remote config
    return featureFlags.isEnabled(flag, user?.tenantId);
  }, [flag, user]);
};

// Usage in components
const MyComponent = () => {
  const showNewFeature = useFeatureFlag('new_booking_ui');
  
  return (
    <div>
      {showNewFeature ? <NewBookingUI /> : <LegacyBookingUI />}
    </div>
  );
};
```

## Continuous Improvement

### Code Review Process
```yaml
# Pull request template
name: Code Review Checklist
about: Ensure code quality and consistency

body:
  - type: checkboxes
    id: code-quality
    attributes:
      label: Code Quality
      options:
        - label: Code follows project conventions
        - label: TypeScript types are properly defined
        - label: Tests cover new functionality
        - label: Documentation is updated
        - label: Performance impact is considered
        - label: Security implications are reviewed
```

### Performance Monitoring
```typescript
// Continuous performance monitoring
export const performanceMonitor = {
  trackPageLoad: (page: string, loadTime: number) => {
    analytics.track('page_load', {
      page,
      loadTime,
      timestamp: Date.now()
    });
    
    if (loadTime > 3000) {
      logger.warn('Slow page load detected', { page, loadTime });
    }
  },
  
  trackApiCall: (endpoint: string, method: string, duration: number) => {
    analytics.track('api_call', {
      endpoint,
      method,
      duration,
      timestamp: Date.now()
    });
    
    if (duration > 1000) {
      logger.warn('Slow API call detected', { endpoint, method, duration });
    }
  }
};
```

---

*This guide evolves with the project. Keep it updated as new patterns and tools are adopted.*