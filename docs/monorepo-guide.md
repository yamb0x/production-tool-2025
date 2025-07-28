# Production Tool 2.0 - Monorepo Structure Guide

## Overview

Production Tool 2.0 uses a **modern monorepo architecture** with Turborepo and pnpm workspaces, enabling efficient development, shared code reuse, and coordinated deployments while maintaining clear boundaries between applications and packages.

## Project Structure

```
production-tool-2025/
├── apps/                          # Applications
│   ├── web/                      # Next.js frontend application
│   ├── api/                      # NestJS backend application  
│   └── mobile/                   # React Native app (future)
├── packages/                     # Shared packages
│   ├── shared-types/            # TypeScript type definitions
│   ├── ui/                      # Shared UI components
│   ├── database/                # Database schema and utilities
│   ├── config/                  # Shared configuration
│   └── utils/                   # Shared utilities
├── docs/                        # Documentation
├── scripts/                     # Build and deployment scripts
├── tools/                       # Development tools and configs
├── .github/                     # GitHub workflows
├── package.json                 # Root package.json with workspaces
├── turbo.json                   # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── tsconfig.json               # Root TypeScript configuration
```

## Applications (`apps/`)

### Frontend App (`apps/web/`)
**Technology**: Next.js 15 with App Router  
**Port**: 3000  
**Purpose**: User-facing web application

```
apps/web/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Route groups
│   │   ├── bookings/         # Booking management pages
│   │   ├── artists/          # Artist profile pages
│   │   ├── projects/         # Project management pages
│   │   └── layout.tsx        # Dashboard layout
│   ├── (auth)/               # Authentication pages
│   │   ├── sign-in/          # Sign in page
│   │   ├── sign-up/          # Sign up page
│   │   └── layout.tsx        # Auth layout
│   ├── api/                  # API routes (proxy to backend)
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/                # React components
│   ├── ui/                   # Base UI components (shadcn/ui)
│   ├── forms/                # Form components
│   ├── layout/               # Layout components
│   └── features/             # Feature-specific components
│       ├── booking/          # Booking-related components
│       ├── artist/           # Artist-related components
│       └── project/          # Project-related components
├── lib/                      # Utilities and configurations
│   ├── api.ts               # API client configuration
│   ├── auth.ts              # Clerk authentication setup
│   ├── socket.ts            # Socket.IO client setup
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod validation schemas
├── hooks/                    # Custom React hooks
│   ├── use-api.ts           # API interaction hooks
│   ├── use-socket.ts        # Real-time data hooks
│   └── use-auth.ts          # Authentication hooks
├── stores/                   # Zustand state stores
│   ├── auth-store.ts        # Authentication state
│   ├── booking-store.ts     # Booking state management
│   └── ui-store.ts          # UI state (modals, loading, etc.)
├── types/                    # Frontend-specific types
├── __tests__/               # Frontend tests
├── public/                  # Static assets
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── package.json             # Frontend dependencies
└── tsconfig.json            # TypeScript configuration
```

### Backend API (`apps/api/`)
**Technology**: NestJS with Express  
**Port**: 8000  
**Purpose**: RESTful API and WebSocket server

```
apps/api/
├── src/
│   ├── modules/              # Domain modules
│   │   ├── auth/            # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── guards/      # Auth guards
│   │   │   └── strategies/  # Auth strategies
│   │   ├── booking/         # Booking domain
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── booking.module.ts
│   │   │   ├── dto/         # Data transfer objects
│   │   │   ├── entities/    # Database entities
│   │   │   └── repositories/ # Data access layer
│   │   ├── artist/          # Artist management
│   │   ├── project/         # Project management
│   │   ├── tenant/          # Multi-tenant functionality
│   │   └── websocket/       # Real-time communication
│   │       ├── gateways/    # Socket.IO gateways
│   │       ├── events/      # Event definitions
│   │       └── handlers/    # Event handlers
│   ├── common/              # Shared backend code
│   │   ├── decorators/      # Custom decorators
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Common guards
│   │   ├── interceptors/    # Request/response interceptors
│   │   ├── middleware/      # Express middleware
│   │   ├── pipes/           # Validation pipes
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration files
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   └── app.config.ts
│   ├── migrations/          # Database migrations
│   ├── app.module.ts        # Root application module
│   ├── main.ts              # Application entry point
│   └── health.controller.ts # Health check endpoint
├── test/                    # Backend tests
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── drizzle/                # Drizzle ORM files
├── package.json            # Backend dependencies
├── tsconfig.json           # TypeScript configuration
├── nest-cli.json           # NestJS CLI configuration
└── jest.config.js          # Jest testing configuration
```

### Mobile App (`apps/mobile/`) - Future
**Technology**: React Native with Expo  
**Purpose**: Mobile companion app

```
apps/mobile/                 # Future React Native app
├── src/
│   ├── screens/            # Screen components
│   ├── components/         # Reusable components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services
│   └── hooks/              # Custom hooks
├── app.json                # Expo configuration
├── package.json            # Mobile dependencies
└── tsconfig.json           # TypeScript configuration
```

## Shared Packages (`packages/`)

### Shared Types (`packages/shared-types/`)
**Purpose**: TypeScript definitions shared across all applications

```
packages/shared-types/
├── src/
│   ├── auth.ts             # Authentication types
│   ├── booking.ts          # Booking-related types
│   ├── artist.ts           # Artist profile types
│   ├── project.ts          # Project management types
│   ├── tenant.ts           # Multi-tenant types
│   ├── api.ts              # API request/response types
│   ├── websocket.ts        # Real-time event types
│   └── index.ts            # Main export file
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

#### Example Type Definitions
```typescript
// packages/shared-types/src/booking.ts
export interface Booking {
  id: string;
  tenantId: string;
  artistId: string;
  projectId?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'hold' | 'pencil' | 'confirmed' | 'cancelled';

export interface CreateBookingRequest {
  artistId: string;
  projectId?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  notes?: string;
}

export interface BookingFilters {
  artistId?: string;
  projectId?: string;
  status?: BookingStatus[];
  startDate?: string;
  endDate?: string;
}
```

### UI Components (`packages/ui/`)
**Purpose**: Shared React components and design system

```
packages/ui/
├── src/
│   ├── components/         # React components
│   │   ├── Button.tsx     # Button component
│   │   ├── Input.tsx      # Input component
│   │   ├── Card.tsx       # Card component
│   │   ├── Modal.tsx      # Modal component
│   │   └── Calendar.tsx   # Calendar component
│   ├── hooks/             # Shared React hooks
│   │   ├── useDisclosure.ts
│   │   └── useLocalStorage.ts
│   ├── utils/             # Component utilities
│   │   ├── cn.ts          # className utility
│   │   └── formatters.ts  # Data formatters
│   ├── styles/            # Shared styles
│   │   ├── globals.css    # Global CSS
│   │   └── components.css # Component styles
│   └── index.ts           # Main export
├── package.json           # UI package dependencies
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

### Database Package (`packages/database/`)
**Purpose**: Database schema, migrations, and utilities

```
packages/database/
├── src/
│   ├── schema/            # Drizzle schema definitions
│   │   ├── tenants.ts    # Tenant table schema
│   │   ├── users.ts      # Users table schema
│   │   ├── artists.ts    # Artists table schema
│   │   ├── bookings.ts   # Bookings table schema
│   │   ├── projects.ts   # Projects table schema
│   │   └── index.ts      # Schema exports
│   ├── migrations/        # Database migrations
│   ├── seeds/            # Seed data for development
│   ├── types.ts          # Database types
│   ├── connection.ts     # Database connection
│   └── index.ts          # Main exports
├── drizzle.config.ts     # Drizzle configuration
├── package.json          # Database dependencies
└── tsconfig.json         # TypeScript configuration
```

### Configuration Package (`packages/config/`)
**Purpose**: Shared configuration and environment variables

```
packages/config/
├── src/
│   ├── environment.ts    # Environment variable validation
│   ├── constants.ts      # Application constants
│   ├── database.ts       # Database configuration
│   ├── auth.ts           # Authentication configuration
│   └── index.ts          # Configuration exports
├── package.json          # Config dependencies
└── tsconfig.json         # TypeScript configuration
```

### Utils Package (`packages/utils/`)
**Purpose**: Shared utility functions and helpers

```
packages/utils/
├── src/
│   ├── date.ts           # Date manipulation utilities
│   ├── validation.ts     # Validation helpers
│   ├── formatting.ts     # Data formatting utilities
│   ├── crypto.ts         # Cryptographic utilities
│   ├── errors.ts         # Custom error classes
│   └── index.ts          # Utility exports
├── package.json          # Utils dependencies
└── tsconfig.json         # TypeScript configuration
```

## Package Dependencies and Relationships

### Dependency Graph
```
apps/web     → packages/shared-types, packages/ui, packages/utils
apps/api     → packages/shared-types, packages/database, packages/config, packages/utils
apps/mobile  → packages/shared-types, packages/ui, packages/utils

packages/ui       → packages/shared-types, packages/utils
packages/database → packages/shared-types, packages/config
packages/config   → packages/utils
```

### Internal Package References
```json
// apps/web/package.json
{
  "dependencies": {
    "@production-tool/shared-types": "workspace:*",
    "@production-tool/ui": "workspace:*",
    "@production-tool/utils": "workspace:*"
  }
}

// apps/api/package.json
{
  "dependencies": {
    "@production-tool/shared-types": "workspace:*",
    "@production-tool/database": "workspace:*",
    "@production-tool/config": "workspace:*",
    "@production-tool/utils": "workspace:*"
  }
}
```

## Workspace Configuration

### Root Package.json
```json
{
  "name": "production-tool-2025",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "cd packages/database && pnpm db:generate",
    "db:migrate": "cd packages/database && pnpm db:migrate",
    "db:studio": "cd packages/database && pnpm db:studio"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

### pnpm Workspace Configuration
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

### Turborepo Configuration
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Development Workflow

### Adding New Packages
```bash
# Create new shared package
mkdir packages/new-package
cd packages/new-package

# Initialize package
pnpm init

# Add to workspace
# Edit package.json to include workspace references
```

### Package Development
```bash
# Install dependencies for specific package
pnpm --filter @production-tool/ui add react

# Run commands for specific package
pnpm --filter web dev
pnpm --filter api build

# Run commands for all packages
pnpm run dev    # All development servers
pnpm run build  # Build all packages
pnpm run test   # Test all packages
```

### Inter-Package Dependencies
```bash
# Add internal dependency
cd apps/web
pnpm add @production-tool/shared-types@workspace:*

# This creates workspace reference in package.json:
# "@production-tool/shared-types": "workspace:*"
```

## Build and Deployment

### Build Order
Turborepo automatically handles build dependencies:

1. **packages/shared-types** - Type definitions (no build step)
2. **packages/utils** - Utility functions
3. **packages/config** - Configuration 
4. **packages/database** - Database schema
5. **packages/ui** - UI components
6. **apps/api** - Backend application
7. **apps/web** - Frontend application

### Deployment Strategy
```yaml
# Each app deploys independently:
apps/web:
  platform: Vercel
  build_command: "cd ../.. && pnpm build --filter=web"
  
apps/api:
  platform: Railway
  build_command: "cd ../.. && pnpm build --filter=api"
```

## Code Organization Best Practices

### File Naming Conventions
```
PascalCase:    Component files (Button.tsx, UserProfile.tsx)
camelCase:     Utility functions, hooks (useAuth.ts, formatDate.ts)
kebab-case:    Directories, config files (user-profile/, next.config.js)
UPPER_CASE:    Constants, environment variables (API_URL, MAX_RETRIES)
```

### Import/Export Patterns
```typescript
// ✅ Good: Barrel exports for packages
// packages/shared-types/src/index.ts
export * from './auth';
export * from './booking';
export * from './artist';

// ✅ Good: Named imports from packages
import { Booking, BookingStatus } from '@production-tool/shared-types';

// ✅ Good: Relative imports within same package
import { formatDate } from '../utils/date';

// ❌ Avoid: Deep imports into other packages
// import { Booking } from '@production-tool/shared-types/src/booking';
```

### TypeScript Configuration
```json
// Root tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@production-tool/*": ["packages/*/src"]
    }
  },
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/api" },
    { "path": "./packages/shared-types" },
    { "path": "./packages/ui" },
    { "path": "./packages/database" },
    { "path": "./packages/config" },
    { "path": "./packages/utils" }
  ]
}
```

## Package Versioning Strategy

### Semantic Versioning
All packages follow semantic versioning:
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Version Management
```bash
# Update all package versions together
pnpm changeset

# Version and publish (for open source packages)
pnpm changeset version
pnpm changeset publish
```

## Testing Strategy

### Test Organization
```
# Unit tests alongside source code
src/
├── booking/
│   ├── booking.service.ts
│   └── booking.service.test.ts

# Integration tests in test directory
test/
├── integration/
│   ├── booking.integration.test.ts
│   └── auth.integration.test.ts
└── e2e/
    └── booking-workflow.e2e.test.ts
```

### Test Commands
```bash
# Run tests for specific package
pnpm --filter api test

# Run tests with coverage
pnpm --filter api test:coverage

# Run all tests
pnpm test
```

## Documentation Structure

### Package Documentation
Each package includes:
- **README.md** - Package overview and usage
- **CHANGELOG.md** - Version history
- **API.md** - API documentation (if applicable)

### Shared Documentation
- **docs/** - Comprehensive project documentation
- **scripts/** - Development and deployment scripts
- **.github/** - GitHub workflows and templates

---

*This monorepo structure enables efficient development while maintaining clear boundaries and shared code reuse across all applications.*