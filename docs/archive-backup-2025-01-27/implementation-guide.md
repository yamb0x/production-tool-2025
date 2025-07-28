# Production Tool 2.0 - Implementation Guide

This guide provides step-by-step instructions for implementing Production Tool 2.0 from scratch. Follow these steps in order to ensure a smooth development process.

## Prerequisites

Before starting, ensure you have:
- Node.js 20+ installed
- pnpm 8+ installed (`npm install -g pnpm`)
- PostgreSQL 15+ (via Docker or local installation)
- Redis 7+ (via Docker or local installation)
- Git configured
- VS Code or preferred IDE
- Docker Desktop installed

## Phase 1: Project Initialization (Day 1)

### Step 1: Initialize Monorepo
```bash
# Navigate to project directory
cd /path/to/production-tool-2025

# Initialize package.json
pnpm init -y

# Install Turborepo
pnpm add -D turbo

# Create .gitignore
echo "node_modules/
dist/
.turbo/
.next/
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json" > .gitignore
```

### Step 2: Create Directory Structure
```bash
# Create app directories
mkdir -p apps/web apps/api

# Create package directories
mkdir -p packages/shared-types/src
mkdir -p packages/ui/src/components
mkdir -p packages/utils/src
mkdir -p packages/config/{eslint,typescript,prettier}

# Create infrastructure directories
mkdir -p docker scripts/{db,seed,deploy}
mkdir -p .github/workflows
mkdir -p .vscode

# Create docs directories (already exist)
mkdir -p docs/{api,guides,operations}
```

### Step 3: Configure Turborepo
Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### Step 4: Configure pnpm Workspace
Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 5: Update Root package.json
```json
{
  "name": "production-tool",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.0.0"
}
```

## Phase 2: Shared Packages Setup (Day 1-2)

### Step 1: Create Shared Types Package
```bash
cd packages/shared-types
pnpm init -y
```

Update `packages/shared-types/package.json`:
```json
{
  "name": "@production-tool/shared-types",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "zod": "^3.22.0"
  }
}
```

Create initial types in `packages/shared-types/src/`:
```typescript
// index.ts
export * from './tenant';
export * from './user';
export * from './artist';
export * from './booking';
export * from './project';
export * from './job';
export * from './api';

// api.ts
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  error?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Copy type definitions from src/lib/db/schema.ts
```

### Step 2: Create Config Package
```bash
cd packages/config
pnpm init -y
```

Create shared ESLint config in `packages/config/eslint/index.js`:
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
```

Create TypeScript config in `packages/config/typescript/base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Phase 3: Backend Setup (Day 2-3)

### Step 1: Initialize NestJS
```bash
cd apps/api
npx @nestjs/cli new . --package-manager pnpm --skip-git
```

### Step 2: Configure Backend Dependencies
Update `apps/api/package.json`:
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-fastify": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@clerk/clerk-sdk-node": "^4.0.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.0.0",
    "@production-tool/shared-types": "workspace:*",
    "socket.io": "^4.0.0",
    "@socket.io/redis-adapter": "^8.0.0",
    "bull": "^4.0.0",
    "zod": "^3.22.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

### Step 3: Create Module Structure
```bash
cd apps/api/src
mkdir -p modules/{auth,tenant,artist,booking,project,job}
mkdir -p common/{decorators,guards,filters,pipes,interceptors}
mkdir -p config database websocket
```

### Step 4: Configure Environment
Create `apps/api/.env.example`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/production_tool

# Auth
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Redis
REDIS_URL=redis://localhost:6379

# API
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

## Phase 4: Frontend Setup (Day 3-4)

### Step 1: Initialize Next.js
```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
```

### Step 2: Configure Frontend Dependencies
Update `apps/web/package.json`:
```json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@clerk/nextjs": "^4.0.0",
    "@production-tool/shared-types": "workspace:*",
    "@production-tool/ui": "workspace:*",
    "zustand": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "socket.io-client": "^4.0.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "date-fns": "^3.0.0"
  }
}
```

### Step 3: Setup Shadcn/ui
```bash
cd apps/web
npx shadcn@latest init
```

Configure `components.json`:
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Step 4: Create Initial Structure
```bash
cd apps/web/src
mkdir -p components/{booking,artist,project,job,shared,ui}
mkdir -p lib/{api,hooks,store,utils}
mkdir -p app/{(auth),(dashboard)}
```

## Phase 5: Database Setup (Day 4-5)

### Step 1: Create Docker Compose
Create `docker/docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: production_tool
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Step 2: Setup Drizzle
```bash
cd apps/api
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg
```

Create `apps/api/drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/database/schema/*',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 3: Implement Schema
Copy the schema from `src/lib/db/schema.ts` to `apps/api/src/database/schema/`.

### Step 4: Create Migration
```bash
cd apps/api
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Phase 6: Authentication Setup (Day 5-6)

### Step 1: Configure Clerk (Backend)
Create `apps/api/src/modules/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  providers: [AuthGuard, TenantGuard],
  exports: [AuthGuard, TenantGuard],
})
export class AuthModule {}
```

### Step 2: Configure Clerk (Frontend)
Create `apps/web/src/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Phase 7: API Development (Week 2-3)

### Step 1: Implement Core Modules
For each module (booking, artist, project, job):
1. Create module structure
2. Define DTOs with validation
3. Implement service layer
4. Create controller with OpenAPI docs
5. Add WebSocket gateway
6. Write tests

### Step 2: Implement Real-time
Create Socket.IO server with Redis adapter for horizontal scaling.

### Step 3: Add Background Jobs
Implement Bull queues for:
- Hold expiration
- Notification delivery
- Backup tasks

## Phase 8: Frontend Development (Week 3-4)

### Step 1: Create Core Components
Build reusable components following the component structure.

### Step 2: Implement State Management
Set up Zustand stores for:
- Booking state
- Artist state
- Project state
- UI state

### Step 3: Connect to API
Implement API client with:
- Type-safe requests
- Error handling
- Loading states
- Optimistic updates

## Phase 9: Testing & Quality (Week 5-6)

### Step 1: Unit Tests
Write tests for:
- Business logic
- Components
- API endpoints

### Step 2: Integration Tests
Test:
- API workflows
- Database operations
- Authentication flow

### Step 3: E2E Tests
Implement critical user journeys.

## Phase 10: Deployment (Week 7-8)

### Step 1: Configure CI/CD
Set up GitHub Actions for:
- Automated testing
- Build verification
- Deployment

### Step 2: Deploy Services
1. Frontend to Vercel
2. Backend to Railway/DigitalOcean
3. Database to Neon
4. Redis to Railway

### Step 3: Monitor & Optimize
- Set up error tracking
- Configure performance monitoring
- Implement logging

## Development Best Practices

### Code Quality
- Run `pnpm lint` before committing
- Write tests for new features
- Update documentation
- Follow TypeScript strict mode

### Security
- Apply tenant isolation everywhere
- Validate all inputs
- Use environment variables
- Regular dependency updates

### Performance
- Implement caching early
- Optimize database queries
- Use pagination
- Monitor bundle size

### Collaboration
- Create feature branches
- Write descriptive commits
- Review code thoroughly
- Update project board

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `pnpm install` from root
   - Check turbo.json dependencies

2. **Database connection issues**
   - Verify Docker is running
   - Check DATABASE_URL format

3. **Type errors**
   - Rebuild shared packages
   - Check import paths

4. **Build failures**
   - Clear turbo cache: `pnpm clean`
   - Rebuild: `pnpm build`

## Next Steps

After completing the implementation:
1. Conduct security audit
2. Performance testing
3. User acceptance testing
4. Documentation review
5. Launch preparation

Remember to update this guide as you discover better practices or encounter new challenges during implementation.