# Production Tool 2.0 - Essential Setup Guide

## Quick Start

Get Production Tool 2.0 running locally in under 10 minutes.

### Prerequisites
- **Node.js 20+**: Latest LTS version
- **pnpm 8+**: Package manager for monorepo
- **MongoDB**: Local or MongoDB Atlas
- **Docker** (optional): For MongoDB container
- **Git**: Version control

### One-Command Setup
```bash
# Clone and setup everything
git clone https://github.com/studio/production-tool-2025.git
cd production-tool-2025
pnpm setup:dev
```

This runs:
1. `pnpm install` - Install all dependencies
2. `docker-compose up -d` - Start local MongoDB + Redis
3. `pnpm db:seed` - Add sample data
4. `pnpm dev` - Start all development servers

### Manual Setup (if needed)

#### 1. Install Dependencies
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

#### 2. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Edit environment variables
nano .env
```

#### 3. Database Setup
```bash
# Option 1: Start MongoDB with Docker
docker-compose up -d

# Option 2: Use local MongoDB installation
# Make sure MongoDB is running on port 27017

# Seed with sample data
pnpm db:seed
```

#### 4. Start Development Servers
```bash
# Start all apps (web + api)
pnpm dev

# Or start individually
pnpm dev:web    # Frontend at http://localhost:3000
pnpm dev:api    # Backend at http://localhost:8000
```

## Environment Configuration

### Required Environment Variables

#### Root `.env`
```bash
# Database
MONGODB_URI="mongodb://localhost:27017/production_tool_dev"
MONGODB_DB_NAME=production_tool_dev

# For MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/production_tool?retryWrites=true&w=majority"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication (Clerk)
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

#### Frontend (`apps/web/.env.local`)
```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Development
NEXT_PUBLIC_DEV_MODE=true
```

#### Backend (`apps/api/.env`)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/production_tool_dev
MONGODB_DB_NAME=production_tool_dev

# Redis
REDIS_URL=redis://localhost:6379

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=8000
NODE_ENV=development
```

### Getting Clerk Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the publishable key and secret key
4. Configure allowed redirect URLs:
   - `http://localhost:3000/api/auth/callback`

## Database Setup Details

### Local MongoDB with Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_DATABASE: production_tool_dev
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Database Commands
```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Reset database (careful!)
pnpm db:reset

# Open database studio
pnpm db:studio

# Seed with sample data
pnpm db:seed

# Backup local database
pnpm db:backup

# Restore from backup
pnpm db:restore backup-file.sql
```

### Schema Validation
```sql
-- Key constraints to verify
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE contype = 'x';  -- Exclusion constraints

-- Should show: no_double_booking constraint on bookings table
```

## Development Workflow

### Monorepo Structure
```
production-tool-2025/
├── apps/
│   ├── web/           # Next.js frontend (localhost:3000)
│   └── api/           # NestJS backend (localhost:8000)
├── packages/
│   ├── shared-types/  # TypeScript types
│   ├── ui/            # Shared components
│   ├── database/      # Schema and migrations
│   └── config/        # Shared configuration
├── docs/              # Documentation
└── scripts/           # Development scripts
```

### Available Commands
```bash
# Development
pnpm dev              # Start all development servers
pnpm dev:web          # Start frontend only
pnpm dev:api          # Start backend only

# Building
pnpm build            # Build all packages
pnpm build:web        # Build frontend
pnpm build:api        # Build backend

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests
pnpm test:e2e         # End-to-end tests

# Quality
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript checking
pnpm format           # Format code with Prettier

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed sample data
```

### Hot Reload Setup
All changes automatically trigger rebuilds:
- **Frontend**: Next.js fast refresh
- **Backend**: Nodemon restart
- **Types**: Automatic regeneration
- **Database**: Migration prompts

## IDE Configuration

### VS Code Setup
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true
  }
}
```

### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss", 
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "drizzle-team.drizzle-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web"
    },
    {
      "name": "Debug Backend", 
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

## Testing Setup

### Test Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test booking.test.ts

# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e --headed
```

### Test Database Setup
```bash
# Create test database
createdb production_tool_test

# Set test environment
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_tool_test"

# Run migrations for test DB
pnpm db:migrate:test
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check database connectivity
mongosh mongodb://localhost:27017/production_tool_dev

# Reset Docker containers
docker-compose down
docker-compose up -d
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change ports in .env files
```

#### 3. Dependencies Issues
```bash
# Clear all node_modules
pnpm clean

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install
```

#### 4. TypeScript Errors
```bash
# Regenerate types from database
pnpm db:generate-types

# Check TypeScript version
pnpm list typescript

# Restart TypeScript server in VS Code
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

#### 5. Build Errors
```bash
# Clear Turbo cache
pnpm turbo clean

# Clear Next.js cache
rm -rf apps/web/.next

# Clear all build artifacts
pnpm clean:dist
```

### Environment Validation
```bash
# Run environment check script
pnpm check:env

# This validates:
# - Node.js version
# - pnpm version
# - Database connectivity
# - Redis connectivity
# - Required environment variables
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=production-tool:*

# Or for specific modules
export DEBUG=production-tool:database,production-tool:auth

# Run with debug output
pnpm dev
```

## Production Deployment

### Environment Preparation
```bash
# Build for production
pnpm build

# Run production checks
pnpm check:production

# Generate production bundle analysis
pnpm analyze
```

### Deployment Commands
```bash
# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Railway
railway up

# Run database migrations in production
pnpm db:migrate:prod
```

### Health Checks
```bash
# Check application health
curl http://localhost:8000/health

# Check database health
curl http://localhost:8000/health/db

# Check all services
pnpm health:check
```

## Security Setup

### Local Security Configuration
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Set up HTTPS for local development (optional)
mkcert localhost 127.0.0.1 ::1
```

### Security Checklist
- [ ] Environment variables are not committed
- [ ] Database uses strong passwords
- [ ] HTTPS is configured for production
- [ ] Clerk is properly configured
- [ ] JWT secrets are secure
- [ ] CORS is configured correctly

## Performance Optimization

### Development Performance
```bash
# Enable Turbo build cache
export TURBO_TELEMETRY_DISABLED=1

# Optimize package installs
pnpm config set store-dir ~/.pnpm-store
pnpm config set cache-dir ~/.pnpm-cache

# Use faster TypeScript compilation
export TS_NODE_TRANSPILE_ONLY=true
```

### Monitoring Setup
```bash
# Install monitoring tools
pnpm add --dev @next/bundle-analyzer

# Analyze bundle size
pnpm analyze:bundle

# Monitor performance
pnpm dev:performance
```

## Team Collaboration

### Git Setup
```bash
# Configure git hooks
pnpm prepare

# Set up commit message template
git config commit.template .gitmessage
```

### Code Review Setup
```bash
# Run pre-commit checks
pnpm pre-commit

# This runs:
# - ESLint
# - Prettier
# - TypeScript check
# - Unit tests
```

### Documentation
```bash
# Generate API documentation
pnpm docs:api

# Start documentation server
pnpm docs:serve

# Generate component documentation
pnpm docs:components
```

---

*This setup guide is maintained as the project evolves. For issues, consult the troubleshooting section or create a GitHub issue.*