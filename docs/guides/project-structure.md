# Production Tool 2.0 Project Structure

## Directory Structure

```
production-tool-2025/
├── docs/                          # All documentation
│   ├── architecture/              # Architecture documents
│   │   ├── decisions/            # ADRs and TDRs
│   │   ├── diagrams/             # Architecture diagrams
│   │   └── plans/                # Architecture plans
│   ├── api/                      # API documentation
│   ├── guides/                   # User and developer guides
│   └── operations/               # Operational docs
│
├── src/                          # Source code
│   ├── app/                      # Next.js app directory
│   │   ├── (auth)/              # Auth group
│   │   ├── (dashboard)/         # Dashboard group
│   │   ├── api/                 # API routes
│   │   └── layout.tsx           # Root layout
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── booking/             # Booking components
│   │   ├── resource/            # Resource components
│   │   └── shared/              # Shared components
│   │
│   ├── lib/                     # Core libraries
│   │   ├── api/                 # API client
│   │   ├── db/                  # Database
│   │   ├── auth/                # Authentication
│   │   └── utils/               # Utilities
│   │
│   ├── modules/                 # Business modules
│   │   ├── booking/             # Booking module
│   │   ├── resource/            # Resource module
│   │   ├── tenant/              # Tenant module
│   │   └── notification/        # Notification module
│   │
│   ├── services/                # External services
│   │   ├── email/               # Email service
│   │   ├── storage/             # File storage
│   │   └── realtime/            # WebSocket service
│   │
│   └── types/                   # TypeScript types
│       ├── api.ts               # API types
│       ├── db.ts                # Database types
│       └── app.ts               # App types
│
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   └── fixtures/                # Test fixtures
│
├── scripts/                     # Build and deploy scripts
│   ├── db/                      # Database scripts
│   ├── seed/                    # Seed data
│   └── deploy/                  # Deployment scripts
│
├── config/                      # Configuration files
│   ├── jest.config.js           # Jest configuration
│   ├── tsconfig.json            # TypeScript config
│   └── next.config.js           # Next.js config
│
├── public/                      # Static assets
│   ├── images/                  # Images
│   └── fonts/                   # Fonts
│
├── .github/                     # GitHub specific
│   ├── workflows/               # CI/CD workflows
│   └── ISSUE_TEMPLATE/          # Issue templates
│
├── .vscode/                     # VS Code settings
│   ├── settings.json            # Workspace settings
│   └── extensions.json          # Recommended extensions
│
├── prisma/                      # Prisma/Drizzle schemas
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
│
└── [root files]
    ├── .env.example             # Environment example
    ├── .gitignore               # Git ignore
    ├── package.json             # Dependencies
    ├── README.md                # Project README
    └── CLAUDE.md                # AI assistant rules
```

## Key Principles

### 1. Clear Separation of Concerns
- **docs/**: All documentation, never mix with code
- **src/**: All source code, organized by type
- **tests/**: Mirror src/ structure for easy navigation
- **config/**: Centralized configuration

### 2. Module Organization
Each module in `src/modules/` follows this structure:
```
booking/
├── domain/           # Business logic
├── repository/       # Data access
├── service/          # Application services
├── dto/              # Data transfer objects
├── events/           # Domain events
└── index.ts          # Public API
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

// 2. Internal absolute imports
import { Button } from '@/components/ui/button';
import { BookingService } from '@/modules/booking';

// 3. Relative imports
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

## Benefits

1. **Scalability**: Easy to find and add files
2. **Maintainability**: Clear organization reduces confusion
3. **Testability**: Tests mirror source structure
4. **AI-Friendly**: Consistent patterns for AI assistance
5. **Team-Friendly**: New developers understand immediately

## Migration Plan

1. Create all directories
2. Move existing files to proper locations
3. Update all imports
4. Update documentation references
5. Set up path aliases in tsconfig.json