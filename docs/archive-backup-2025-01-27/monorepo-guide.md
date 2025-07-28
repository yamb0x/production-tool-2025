# Production Tool 2.0 - Monorepo Guide

## Overview

Production Tool 2.0 uses a monorepo structure with Turborepo and pnpm to manage multiple applications and shared packages. This guide explains how to work effectively within this structure.

## Why Monorepo?

### Benefits
1. **Type Safety**: Shared types ensure consistency between frontend and backend
2. **Code Reuse**: Common utilities and components across applications
3. **Atomic Changes**: Related changes across apps in single commits
4. **Independent Deployments**: Frontend and backend deploy separately
5. **Efficient Development**: Turborepo caches build outputs

### Trade-offs
- Initial setup complexity
- Larger repository size
- Need to understand workspace concepts

## Structure Overview

```
production-tool/
├── apps/                   # Applications
│   ├── web/               # Next.js frontend
│   └── api/               # NestJS backend
├── packages/              # Shared packages
│   ├── shared-types/      # TypeScript interfaces
│   ├── ui/               # Shared components
│   ├── utils/            # Common utilities
│   └── config/           # Shared configs
├── turbo.json            # Turborepo config
├── pnpm-workspace.yaml   # Workspace config
└── package.json          # Root package
```

## Working with the Monorepo

### Installation

```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Running Applications

```bash
# Run everything in development
pnpm dev

# Run specific app
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only

# Run both but see separate logs
pnpm dev --filter=web --filter=api
```

### Building

```bash
# Build everything
pnpm build

# Build specific app
pnpm build:web
pnpm build:api

# Build with dependencies
pnpm build --filter=web...
```

### Testing

```bash
# Test everything
pnpm test

# Test specific package
pnpm test --filter=@production-tool/shared-types

# Test with coverage
pnpm test:coverage
```

## Creating New Packages

### 1. Create Package Directory

```bash
mkdir packages/new-package
cd packages/new-package
```

### 2. Initialize Package

```json
// packages/new-package/package.json
{
  "name": "@production-tool/new-package",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "devDependencies": {
    "@production-tool/config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Add TypeScript Config

```json
// packages/new-package/tsconfig.json
{
  "extends": "@production-tool/config/tsconfig/base.json",
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

### 4. Create Source Files

```typescript
// packages/new-package/src/index.ts
export * from './my-utility';
```

## Using Shared Packages

### In Frontend (apps/web)

```typescript
// Import from shared packages
import { BookingType, ArtistType } from '@production-tool/shared-types';
import { Button, Card } from '@production-tool/ui';
import { formatDate, calculateDuration } from '@production-tool/utils';

// Use in components
const BookingCard: React.FC<{ booking: BookingType }> = ({ booking }) => {
  return (
    <Card>
      <h3>{booking.title}</h3>
      <p>{formatDate(booking.startTime)}</p>
      <Button>View Details</Button>
    </Card>
  );
};
```

### In Backend (apps/api)

```typescript
// Import from shared packages
import { BookingType, CreateBookingDto } from '@production-tool/shared-types';
import { validateDateRange } from '@production-tool/utils';

@Controller('bookings')
export class BookingController {
  @Post()
  async create(@Body() dto: CreateBookingDto): Promise<BookingType> {
    validateDateRange(dto.startTime, dto.endTime);
    // ... create booking
  }
}
```

## Turborepo Pipeline

### Configuration (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### Task Dependencies

- `^build` - Build dependencies first
- `build` - Then build this package
- Tasks run in parallel when possible

## Best Practices

### 1. Package Boundaries

```typescript
// ✅ Good - Clear dependencies
// packages/shared-types depends on nothing
// packages/utils depends on shared-types
// apps/* depend on packages/*

// ❌ Bad - Circular dependencies
// packages/ui depends on apps/web
```

### 2. Version Management

```json
// Use workspace protocol for internal packages
{
  "dependencies": {
    "@production-tool/shared-types": "workspace:*"
  }
}
```

### 3. Type Sharing

```typescript
// packages/shared-types/src/booking.ts
export interface BookingType {
  id: string;
  artistId: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
}

export enum BookingStatus {
  PENCIL = 'pencil',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

// Both frontend and backend use the same types
```

### 4. Configuration Sharing

```javascript
// packages/config/eslint/base.js
module.exports = {
  extends: ['next', 'turbo', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
  },
};

// apps/web/.eslintrc.js
module.exports = {
  extends: ['@production-tool/config/eslint/base'],
};
```

## Common Commands

### Development

```bash
# Start everything
pnpm dev

# Start with specific filter
pnpm dev --filter=web

# Start with dependencies
pnpm dev --filter=web...

# Clean everything
pnpm clean
```

### Building

```bash
# Build all
pnpm build

# Build specific
pnpm build --filter=api

# Build with cache
pnpm build # Turborepo caches automatically
```

### Testing

```bash
# Test all
pnpm test

# Test watch mode
pnpm test:watch

# Test specific
pnpm test --filter=shared-types
```

### Adding Dependencies

```bash
# Add to specific workspace
pnpm add express --filter=api

# Add to root (dev tools)
pnpm add -D prettier -w

# Add workspace package
pnpm add @production-tool/shared-types --filter=web
```

## Troubleshooting

### Common Issues

1. **Module not found**
   ```bash
   # Rebuild packages
   pnpm build --filter=@production-tool/*
   ```

2. **Type errors**
   ```bash
   # Rebuild types
   pnpm type-check
   ```

3. **Cache issues**
   ```bash
   # Clear Turborepo cache
   pnpm clean
   rm -rf .turbo
   ```

4. **Dependency conflicts**
   ```bash
   # Reinstall everything
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

### Debug Mode

```bash
# Run with Turborepo debug logs
TURBO_LOG_LEVEL=debug pnpm build

# Dry run to see what would execute
pnpm build --dry-run
```

## CI/CD Considerations

### GitHub Actions

```yaml
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build
  run: pnpm build

- name: Test
  run: pnpm test
```

### Deployment

Frontend and backend deploy independently:
- Frontend: Vercel detects `apps/web`
- Backend: Railway/DigitalOcean builds `apps/api`

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Monorepo Best Practices](https://monorepo.tools/)

---

*This guide is part of the Production Tool 2.0 documentation. For architecture details, see `docs/architecture.md`.*