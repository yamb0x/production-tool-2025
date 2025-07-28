# Production Tool 2.0 Monorepo Structure

## Complete Directory Structure

```
production-tool/
├── apps/                          # Applications
│   ├── web/                      # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   │   ├── (auth)/      # Authentication routes
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/ # Protected dashboard routes
│   │   │   │   │   ├── bookings/
│   │   │   │   │   ├── artists/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── jobs/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/         # API route handlers
│   │   │   │   ├── layout.tsx   # Root layout
│   │   │   │   └── page.tsx     # Home page
│   │   │   │
│   │   │   ├── components/      # React components
│   │   │   │   ├── booking/     # Booking features
│   │   │   │   │   ├── BookingCalendar.tsx
│   │   │   │   │   ├── BookingForm.tsx
│   │   │   │   │   ├── BookingCard.tsx
│   │   │   │   │   └── BookingTimeline.tsx
│   │   │   │   ├── artist/      # Artist features
│   │   │   │   │   ├── ArtistProfile.tsx
│   │   │   │   │   ├── ArtistList.tsx
│   │   │   │   │   ├── ArtistAvailability.tsx
│   │   │   │   │   └── ArtistPortfolio.tsx
│   │   │   │   ├── project/     # Project features
│   │   │   │   │   ├── ProjectGantt.tsx
│   │   │   │   │   ├── ProjectCard.tsx
│   │   │   │   │   ├── ProjectPhases.tsx
│   │   │   │   │   └── ProjectTeam.tsx
│   │   │   │   ├── job/         # Job features
│   │   │   │   │   ├── JobListing.tsx
│   │   │   │   │   ├── JobApplication.tsx
│   │   │   │   │   ├── JobFilters.tsx
│   │   │   │   │   └── JobBoard.tsx
│   │   │   │   ├── shared/      # Shared components
│   │   │   │   │   ├── Layout/
│   │   │   │   │   ├── Navigation/
│   │   │   │   │   ├── Forms/
│   │   │   │   │   └── Modals/
│   │   │   │   └── ui/          # Shadcn/ui components
│   │   │   │
│   │   │   ├── lib/             # Frontend utilities
│   │   │   │   ├── api/         # API client
│   │   │   │   │   ├── client.ts
│   │   │   │   │   ├── bookings.ts
│   │   │   │   │   ├── artists.ts
│   │   │   │   │   └── projects.ts
│   │   │   │   ├── hooks/       # Custom React hooks
│   │   │   │   │   ├── useBookings.ts
│   │   │   │   │   ├── useRealtime.ts
│   │   │   │   │   └── useAuth.ts
│   │   │   │   ├── store/       # Zustand stores
│   │   │   │   │   ├── bookingStore.ts
│   │   │   │   │   ├── artistStore.ts
│   │   │   │   │   └── uiStore.ts
│   │   │   │   └── utils/       # Utility functions
│   │   │   │       ├── cn.ts
│   │   │   │       ├── dates.ts
│   │   │   │       └── format.ts
│   │   │   │
│   │   │   └── middleware.ts    # Next.js middleware
│   │   │
│   │   ├── public/              # Static assets
│   │   ├── .env.example         # Environment example
│   │   ├── next.config.js       # Next.js config
│   │   ├── tailwind.config.ts   # Tailwind config
│   │   ├── components.json      # Shadcn/ui config
│   │   └── package.json         # Frontend dependencies
│   │
│   └── api/                      # NestJS backend application
│       ├── src/
│       │   ├── modules/          # Feature modules
│       │   │   ├── auth/         # Authentication module
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── guards/
│       │   │   │   └── strategies/
│       │   │   │
│       │   │   ├── tenant/       # Multi-tenant module
│       │   │   │   ├── tenant.module.ts
│       │   │   │   ├── tenant.controller.ts
│       │   │   │   ├── tenant.service.ts
│       │   │   │   └── tenant.repository.ts
│       │   │   │
│       │   │   ├── booking/      # Booking module
│       │   │   │   ├── booking.module.ts
│       │   │   │   ├── booking.controller.ts
│       │   │   │   ├── booking.service.ts
│       │   │   │   ├── booking.gateway.ts
│       │   │   │   ├── booking.repository.ts
│       │   │   │   ├── dto/
│       │   │   │   └── events/
│       │   │   │
│       │   │   ├── artist/       # Artist module
│       │   │   │   ├── artist.module.ts
│       │   │   │   ├── artist.controller.ts
│       │   │   │   ├── artist.service.ts
│       │   │   │   ├── artist.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── project/      # Project module
│       │   │   │   ├── project.module.ts
│       │   │   │   ├── project.controller.ts
│       │   │   │   ├── project.service.ts
│       │   │   │   ├── project.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   └── job/          # Job module
│       │   │       ├── job.module.ts
│       │   │       ├── job.controller.ts
│       │   │       ├── job.service.ts
│       │   │       ├── job.repository.ts
│       │   │       └── dto/
│       │   │
│       │   ├── common/           # Shared utilities
│       │   │   ├── decorators/   # Custom decorators
│       │   │   │   ├── tenant.decorator.ts
│       │   │   │   └── user.decorator.ts
│       │   │   ├── guards/       # Auth guards
│       │   │   │   ├── auth.guard.ts
│       │   │   │   ├── tenant.guard.ts
│       │   │   │   └── roles.guard.ts
│       │   │   ├── filters/      # Exception filters
│       │   │   │   ├── http-exception.filter.ts
│       │   │   │   └── validation.filter.ts
│       │   │   ├── pipes/        # Validation pipes
│       │   │   │   └── zod-validation.pipe.ts
│       │   │   └── interceptors/ # Request interceptors
│       │   │       ├── logging.interceptor.ts
│       │   │       └── transform.interceptor.ts
│       │   │
│       │   ├── config/           # Configuration
│       │   │   ├── app.config.ts
│       │   │   ├── database.config.ts
│       │   │   └── redis.config.ts
│       │   │
│       │   ├── database/         # Database layer
│       │   │   ├── schema/       # Drizzle schema
│       │   │   ├── migrations/   # Database migrations
│       │   │   └── seeds/        # Seed data
│       │   │
│       │   ├── websocket/        # WebSocket setup
│       │   │   └── websocket.adapter.ts
│       │   │
│       │   ├── app.module.ts     # Root module
│       │   └── main.ts           # Application entry
│       │
│       ├── test/                 # Backend tests
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       │
│       ├── .env.example          # Environment example
│       ├── nest-cli.json         # NestJS CLI config
│       ├── drizzle.config.ts     # Drizzle ORM config
│       └── package.json          # Backend dependencies
│
├── packages/                      # Shared packages (monorepo)
│   ├── shared-types/             # TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── api/             # API types
│   │   │   │   ├── request.ts
│   │   │   │   └── response.ts
│   │   │   ├── models/          # Data models
│   │   │   │   ├── tenant.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── artist.ts
│   │   │   │   ├── booking.ts
│   │   │   │   ├── project.ts
│   │   │   │   └── job.ts
│   │   │   ├── enums/           # Shared enums
│   │   │   └── index.ts         # Main export
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── components/      # Reusable components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   └── Form/
│   │   │   ├── hooks/           # Shared hooks
│   │   │   └── styles/          # Shared styles
│   │   └── package.json
│   │
│   ├── utils/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── date.ts          # Date utilities
│   │   │   ├── validation.ts    # Validation helpers
│   │   │   ├── format.ts        # Formatting utilities
│   │   │   └── constants.ts     # Shared constants
│   │   └── package.json
│   │
│   └── config/                   # Shared configuration
│       ├── eslint/              # ESLint configs
│       │   ├── base.js
│       │   ├── react.js
│       │   └── node.js
│       ├── typescript/          # TypeScript configs
│       │   ├── base.json
│       │   ├── react.json
│       │   └── node.json
│       └── prettier/            # Prettier config
│           └── index.js
│
├── docs/                         # Documentation
│   ├── architecture/             # Architecture documents
│   │   ├── architecture.md      # Main architecture doc
│   │   ├── decisions/           # ADRs and TDRs
│   │   ├── diagrams/            # Architecture diagrams
│   │   └── plans/               # Architecture plans
│   ├── api/                     # API documentation
│   │   ├── openapi.yaml         # OpenAPI spec
│   │   └── postman/             # Postman collections
│   ├── guides/                  # Developer guides
│   │   ├── getting-started.md
│   │   ├── development.md
│   │   └── deployment.md
│   └── operations/              # Operational docs
│       ├── runbooks/
│       └── monitoring/
│
├── scripts/                      # Automation scripts
│   ├── db/                      # Database scripts
│   │   ├── migrate.sh
│   │   └── backup.sh
│   ├── seed/                    # Seed data scripts
│   │   └── seed.ts
│   └── deploy/                  # Deployment scripts
│       ├── deploy-web.sh
│       └── deploy-api.sh
│
├── docker/                       # Docker configurations
│   ├── Dockerfile.web           # Frontend Dockerfile
│   ├── Dockerfile.api           # Backend Dockerfile
│   ├── docker-compose.yml       # Local development
│   └── docker-compose.prod.yml  # Production setup
│
├── .github/                      # GitHub specific
│   ├── workflows/               # CI/CD workflows
│   │   ├── ci.yml              # Continuous integration
│   │   ├── deploy.yml          # Deployment workflow
│   │   └── codeql.yml          # Security scanning
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── pull_request_template.md
│
├── .vscode/                      # VS Code settings
│   ├── settings.json            # Workspace settings
│   ├── extensions.json          # Recommended extensions
│   └── launch.json              # Debug configurations
│
└── [root files]
    ├── turbo.json               # Turborepo configuration
    ├── pnpm-workspace.yaml      # PNPM workspace config
    ├── package.json             # Root package.json
    ├── .env.example             # Environment variables example
    ├── .gitignore               # Git ignore rules
    ├── .prettierrc              # Prettier config
    ├── .eslintrc.js             # ESLint config
    ├── README.md                # Project README
    ├── CLAUDE.md                # AI assistant rules
    └── LICENSE                  # Project license
```

## Key Principles

### 1. Clear Separation of Concerns
- **docs/**: All documentation, never mix with code
- **src/**: All source code, organized by type
- **tests/**: Mirror src/ structure for easy navigation
- **config/**: Centralized configuration

### 2. Backend Module Organization (NestJS)
Each module in `apps/api/src/modules/` follows this structure:
```
booking/
├── booking.module.ts      # Module definition
├── booking.controller.ts  # REST endpoints
├── booking.service.ts     # Business logic
├── booking.gateway.ts     # WebSocket gateway
├── dto/                   # Data transfer objects
│   ├── create-booking.dto.ts
│   └── update-booking.dto.ts
├── entities/              # Database entities
│   └── booking.entity.ts
├── repositories/          # Data access layer
│   └── booking.repository.ts
└── events/               # Domain events
    └── booking.events.ts
```

### 3. Component Organization
```
components/
├── ui/               # Pure UI components (Shadcn)
├── [feature]/        # Feature-specific components
│   ├── Component.tsx
│   ├── Component.test.tsx
│   └── Component.stories.tsx
└── shared/           # Shared across features
```

### 4. File Naming Conventions
- **Components**: PascalCase (e.g., `BookingCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase with `.types.ts` suffix
- **Tests**: Same name with `.test.ts` suffix
- **Stories**: Same name with `.stories.tsx` suffix

### 5. Import Order
```typescript
// 1. External imports
import React from 'react';
import { format } from 'date-fns';

// 2. Monorepo package imports
import { BookingType, ArtistType } from '@production-tool/shared-types';
import { Button } from '@production-tool/ui';
import { formatDate } from '@production-tool/utils';

// 3. Internal absolute imports (app-specific)
import { BookingCard } from '@/components/booking';
import { useAuth } from '@/lib/hooks/useAuth';

// 4. Relative imports
import { formatCurrency } from './utils';
import type { BookingProps } from './types';
```

## Documentation Organization

### Architecture Documents (`docs/architecture/`)
- `decisions/` - All ADRs and TDRs
- `plans/` - Architecture plans and designs
- `diagrams/` - C4, sequence, and other diagrams

### API Documentation (`docs/api/`)
- OpenAPI specifications
- Postman collections
- API guides

### Guides (`docs/guides/`)
- Getting started
- Development guide
- Deployment guide
- Contributing guide

### Operations (`docs/operations/`)
- Runbooks
- Monitoring setup
- Incident response

## Monorepo Benefits

1. **Type Safety**: Shared types ensure frontend/backend consistency
2. **Code Reuse**: Common utilities and components shared across apps
3. **Independent Deployments**: Frontend and backend deploy separately
4. **Clear API Boundaries**: Enforced separation between apps
5. **Efficient Development**: Turborepo caches and optimizes builds
6. **Atomic Changes**: Related changes across apps in single commit
7. **Consistent Tooling**: Shared ESLint, Prettier, TypeScript configs

## Architecture Benefits

1. **Scalability**: Frontend and backend scale independently
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Isolated testing for each app
4. **AI-Friendly**: Consistent patterns for AI assistance
5. **Team-Friendly**: Clear boundaries for collaboration
6. **Technology Freedom**: Can change frontend without touching backend
7. **API-First**: Clear contracts enable mobile apps later

## Migration Plan (From Current to Monorepo)

1. **Initialize Monorepo**
   - Set up Turborepo and pnpm workspaces
   - Create root package.json with scripts

2. **Create App Directories**
   - Move frontend code to `apps/web/`
   - Create `apps/api/` for NestJS backend

3. **Extract Shared Packages**
   - Create `packages/shared-types/` from existing types
   - Create `packages/ui/` for shared components
   - Create `packages/config/` for shared configs

4. **Update Imports**
   - Replace relative imports with package imports
   - Update TypeScript paths configuration

5. **Configure Build Pipeline**
   - Set up Turborepo pipeline
   - Configure parallel builds and tests

6. **Update CI/CD**
   - Update GitHub Actions for monorepo
   - Configure deployment for both apps