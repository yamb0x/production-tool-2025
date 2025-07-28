# Environment Configuration Guide

## Overview

Production Tool 2.0 requires specific environment variables for proper operation across development, staging, and production environments. This guide provides comprehensive documentation for all required and optional environment variables.

## Environment Files Structure

```
production-tool-2025/
├── .env.example                 # Template with all variables
├── .env.local                   # Local development (git-ignored)
├── .env.staging                 # Staging environment (git-ignored)
├── .env.production             # Production environment (git-ignored)
├── apps/web/.env.local         # Frontend-specific local vars
└── apps/api/.env.local         # Backend-specific local vars
```

## Core Environment Variables

### Database Configuration
```env
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/production_tool_dev"
DATABASE_POOL_SIZE=20
DATABASE_SSL_MODE="prefer"

# For production, use connection pooling
DATABASE_POOL_URL="postgresql://username:password@pooler.neon.tech:5432/production_tool"
```

### Authentication (Clerk)
```env
# Clerk Authentication - Get from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="24h"
```

### Redis Configuration
```env
# Redis for sessions and real-time features
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB=0

# For production
REDIS_URL="rediss://username:password@redis-provider.com:6380"
```

### Application Configuration
```env
# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000/ws"

# For production
NEXT_PUBLIC_APP_URL="https://app.productiontool.com"
NEXT_PUBLIC_API_URL="https://api.productiontool.com"
NEXT_PUBLIC_WS_URL="wss://api.productiontool.com/ws"
```

### External Services
```env
# Email Service (SendGrid, Resend, etc.)
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="SG...."
FROM_EMAIL="noreply@productiontool.com"

# File Storage (AWS S3, Cloudinary, etc.)
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="production-tool-assets"

# Analytics (Optional)
POSTHOG_KEY="phc_..."
POSTHOG_HOST="https://app.posthog.com"

# Error Tracking (Optional)
SENTRY_DSN="https://..."
SENTRY_ORG="production-tool"
SENTRY_PROJECT="production-tool-2025"
```

### Development Tools
```env
# Development only
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_SWAGGER="true"
ENABLE_PLAYGROUND="true"

# Database tools
DRIZZLE_STUDIO_PORT=4983
```

## Environment-Specific Configurations

### Development Environment
```env
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/production_tool_dev
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=true
```

### Staging Environment
```env
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=${STAGING_DATABASE_URL}
REDIS_URL=${STAGING_REDIS_URL}
NEXT_PUBLIC_APP_URL=https://staging.productiontool.com
NEXT_PUBLIC_API_URL=https://api-staging.productiontool.com
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=false
```

### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=${PRODUCTION_DATABASE_URL}
REDIS_URL=${PRODUCTION_REDIS_URL}
NEXT_PUBLIC_APP_URL=https://app.productiontool.com
NEXT_PUBLIC_API_URL=https://api.productiontool.com
ENABLE_SWAGGER=false
ENABLE_PLAYGROUND=false
```

## Security Best Practices

### 1. Secret Management
- **Never commit** `.env` files to version control
- Use **different secrets** for each environment
- **Rotate secrets** regularly (every 90 days)
- Use **strong, random** JWT secrets (minimum 32 characters)

### 2. Database Security
- Use **connection pooling** in production
- Enable **SSL connections** for remote databases
- Use **read-only replicas** for reporting queries
- **Limit connection pool size** to prevent resource exhaustion

### 3. API Security
- Use **HTTPS only** in production
- Enable **CORS** with specific origins
- Implement **rate limiting** per endpoint
- Use **secure headers** (HSTS, CSP, etc.)

## Environment Validation

### Zod Schema for Validation
```typescript
// packages/config/src/environment.ts
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export const env = environmentSchema.parse(process.env);
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Test connection with URL
redis-cli -u $REDIS_URL ping
```

#### Clerk Authentication Issues
- Verify publishable key starts with `pk_`
- Verify secret key starts with `sk_`
- Check domain configuration in Clerk dashboard
- Ensure URLs match in both Clerk and environment

### Environment Loading Order
1. System environment variables
2. `.env.local` (highest priority, git-ignored)
3. `.env.production`, `.env.staging`, `.env.development`
4. `.env` (lowest priority)

## Quick Setup Commands

### Initial Setup
```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
pnpm install

# Generate database schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Testing
```bash
# Test database connection
pnpm db:test

# Test Redis connection
pnpm redis:test

# Validate all environment variables
pnpm env:validate

# Check application health
curl http://localhost:8000/health
```

## CI/CD Environment Variables

### GitHub Actions Secrets
```
# Database
DATABASE_URL
REDIS_URL

# Authentication
CLERK_SECRET_KEY
JWT_SECRET

# External Services
SENDGRID_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Deployment
VERCEL_TOKEN
RAILWAY_TOKEN
```

### Deployment Environment Variables
```
# Vercel (Frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_URL

# Railway (Backend)
DATABASE_URL
REDIS_URL
CLERK_SECRET_KEY
JWT_SECRET
```

---

**Note**: Always validate your environment configuration before deploying to production. Use the provided validation schemas and test commands to ensure all services can connect properly.