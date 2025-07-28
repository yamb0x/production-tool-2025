# Production Tool 2.0 - Complete Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20+ LTS | [Download](https://nodejs.org/) |
| pnpm | 8+ | `npm install -g pnpm` |
| PostgreSQL | 15+ | Via Docker or [Download](https://www.postgresql.org/) |
| Redis | 7+ | Via Docker or [Download](https://redis.io/) |
| Docker Desktop | Latest | [Download](https://www.docker.com/products/docker-desktop/) |
| Git | Latest | [Download](https://git-scm.com/) |
| VS Code | Latest | [Download](https://code.visualstudio.com/) |

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd production-tool-2025
```

### 2. Install pnpm (if needed)
```bash
# Check if pnpm is installed
pnpm --version

# If not installed
npm install -g pnpm@8
```

### 3. Install Dependencies
```bash
# Install all dependencies for monorepo
pnpm install

# This will install dependencies for:
# - Root workspace
# - apps/web (Frontend)
# - apps/api (Backend)
# - All packages/*
```

### 4. Environment Configuration

#### Create Environment Files
```bash
# Frontend environment
cp apps/web/.env.example apps/web/.env.local

# Backend environment
cp apps/api/.env.example apps/api/.env.local

# Root environment (if needed)
cp .env.example .env.local
```

#### Frontend Environment Variables (apps/web/.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Clerk Authentication (Frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

#### Backend Environment Variables (apps/api/.env.local)
```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/production_tool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (for caching and real-time)
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=prod_tool:

# Clerk Authentication (Backend)
CLERK_SECRET_KEY=sk_test_your_secret_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT (for WebSocket auth)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Optional: External Services
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
SENDGRID_API_KEY=
SENTRY_DSN=
```

### 5. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker ps

# You should see:
# - postgres:15-alpine on port 5432
# - redis:7-alpine on port 6379
```

#### Option B: Local Installation
If you have PostgreSQL and Redis installed locally:
```bash
# Create database
createdb production_tool

# Verify connection
psql -d production_tool -c "SELECT version();"
```

#### Run Database Migrations
```bash
# Generate Drizzle migrations from schema
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Seed with sample data (optional)
pnpm db:seed
```

### 6. Clerk Authentication Setup

1. **Create Clerk Account**
   - Go to [clerk.com](https://clerk.com)
   - Create new application
   - Choose "Production Tool" as name

2. **Get API Keys**
   - Navigate to API Keys section
   - Copy Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Copy Secret Key → `CLERK_SECRET_KEY`

3. **Configure Webhooks** (for user sync)
   - Add endpoint: `http://localhost:3001/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy Webhook Secret → `CLERK_WEBHOOK_SECRET`

4. **Configure OAuth (Optional)**
   - Enable Google, GitHub, etc.
   - Add redirect URLs

## Development

### Start Development Servers

#### All Services (Recommended)
```bash
# Start everything in development mode
pnpm dev

# This runs:
# - Frontend (Next.js) on http://localhost:3000
# - Backend (NestJS) on http://localhost:3001
# - File watchers for all packages
```

#### Individual Services
```bash
# Frontend only
pnpm dev:web

# Backend only
pnpm dev:api

# Specific package development
pnpm --filter @production-tool/shared-types dev
```

### Common Development Commands

```bash
# Linting
pnpm lint                 # Lint all packages
pnpm lint:web            # Lint frontend only
pnpm lint:api            # Lint backend only

# Type Checking
pnpm type-check          # Check all packages
pnpm type-check:web      # Check frontend only
pnpm type-check:api      # Check backend only

# Testing
pnpm test                # Run all tests
pnpm test:web           # Frontend tests
pnpm test:api           # Backend tests
pnpm test:watch         # Watch mode

# Building
pnpm build              # Build all packages
pnpm build:web          # Build frontend
pnpm build:api          # Build backend

# Database
pnpm db:studio          # Open Drizzle Studio
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed database
pnpm db:reset           # Reset database

# Clean
pnpm clean              # Clean all build artifacts
pnpm clean:modules      # Remove node_modules
```

## Verification

### 1. Check Frontend
- Navigate to http://localhost:3000
- You should see the landing page
- Check browser console for errors

### 2. Check Backend
- Navigate to http://localhost:3001/api
- You should see API documentation (Swagger)
- Test health endpoint: http://localhost:3001/health

### 3. Check Database
```bash
# Connect to database
psql -d production_tool

# Check tables
\dt

# You should see tables like:
# - tenants
# - users
# - artists
# - bookings
# - projects
```

### 4. Check Real-time
- Open two browser windows
- Login to both
- Create a booking in one
- Should see real-time update in other

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # or :3001, :5432, :6379

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5432/production_tool

# Check logs
docker logs production-tool-postgres
```

### Module Not Found Errors
```bash
# Clear everything and reinstall
pnpm clean
rm -rf node_modules
rm -rf .turbo
pnpm install
pnpm build:packages
```

### TypeScript Errors
```bash
# Rebuild TypeScript declarations
pnpm build:packages
pnpm type-check
```

### Clerk Authentication Issues
- Verify API keys are correct
- Check Clerk dashboard for errors
- Ensure cookies are enabled
- Try incognito mode

## Next Steps

1. **Read Documentation**
   - [Architecture Overview](./architecture.md)
   - [Implementation Guide](./guides/implementation-guide.md)
   - [Development Workflow](./guides/development-workflow.md)

2. **Explore Codebase**
   - Check example components in `apps/web/components`
   - Review API structure in `apps/api/src/modules`
   - Look at shared types in `packages/shared-types`

3. **Start Building**
   - Pick a feature from the roadmap
   - Create a feature branch
   - Follow the development workflow

## Production Deployment

See [Deployment Guide](./guides/deployment.md) for production setup instructions.

## Development Scripts

### Root Scripts (Monorepo)
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm test` - Run tests for all apps
- `pnpm lint` - Run ESLint across monorepo
- `pnpm type-check` - TypeScript checking for all apps
- `pnpm clean` - Clean all build artifacts

### App-Specific Scripts
- `pnpm dev:web` - Start frontend only
- `pnpm dev:api` - Start backend only
- `pnpm build:web` - Build frontend
- `pnpm build:api` - Build backend

### Database Scripts
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Drizzle Studio

## Tech Stack Overview

### Monorepo Management
- **Turborepo** - Build system for monorepos
- **pnpm** - Fast, disk space efficient package manager
- **TypeScript** - Shared types across frontend/backend

### Frontend (apps/web)
- **Next.js 15** - React framework (SSR/SSG only)
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library built on Radix UI
- **Zustand** - Lightweight state management
- **React Hook Form + Zod** - Form handling and validation
- **Socket.IO Client** - Real-time updates

### Backend (apps/api)
- **NestJS** - Enterprise Node.js framework
- **Fastify** - High-performance HTTP adapter
- **Clerk** - Authentication and user management
- **Drizzle ORM** - Type-safe database ORM
- **PostgreSQL** - Primary database with GIST constraints
- **Redis** - Caching and Socket.IO adapter
- **Socket.IO** - WebSocket server for real-time
- **Bull** - Redis-based job queue

### Shared Packages
- **@production-tool/shared-types** - TypeScript interfaces
- **@production-tool/ui** - Shared UI components
- **@production-tool/utils** - Common utilities
- **@production-tool/config** - Shared configurations

### Infrastructure
- **Vercel** - Frontend hosting (SSR/SSG)
- **Railway/DigitalOcean** - Backend hosting
- **Neon** - Managed PostgreSQL
- **Cloudflare R2** - File storage
- **GitHub Actions** - Monorepo-aware CI/CD

## Monorepo Structure

```
production-tool/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Frontend utilities
│   │   └── public/           # Static assets
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── modules/       # Feature modules
│       │   ├── common/        # Shared utilities
│       │   └── main.ts        # App entry point
│       └── test/              # Backend tests
│
├── packages/
│   ├── shared-types/          # TypeScript interfaces
│   ├── ui/                    # Shared UI components
│   ├── utils/                 # Common utilities
│   └── config/                # Shared configs
│
├── docker/
│   ├── docker-compose.yml     # Local services
│   └── Dockerfile.*           # Container configs
│
├── docs/                      # Documentation
├── scripts/                   # Build scripts
└── turbo.json                # Turborepo config
```

## Key Features

### Multi-Tenant Architecture
- Row-level security (RLS) for data isolation
- Tenant-scoped API endpoints
- Tenant context management

### Real-Time Updates
- Socket.IO for live synchronization
- Optimistic updates for better UX
- Event-driven architecture

### Booking System
- Conflict detection and prevention
- Resource availability checking
- Time-based scheduling

### Authentication
- Clerk integration for user management
- Role-based access control (RBAC)
- Protected API routes

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes | - |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes | - |
| `NEXT_PUBLIC_API_URL` | API base URL | Yes | http://localhost:3000 |
| `REDIS_URL` | Redis connection string | No | redis://localhost:6379 |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key | No | - |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key | No | - |
| `SENTRY_DSN` | Sentry error tracking | No | - |

## Database Schema

### Core Tables
- **tenants** - Multi-tenant organization data
- **users** - User accounts with Clerk integration
- **resources** - Bookable resources (people, equipment, spaces)
- **projects** - Project management
- **bookings** - Resource bookings with conflict prevention
- **availability** - Resource availability windows

### Key Features
- **Multi-tenancy**: Row-level security for data isolation
- **Optimistic locking**: Version field for conflict resolution
- **Time-based constraints**: PostgreSQL exclusion constraints for booking conflicts
- **Indexing**: Optimized for common query patterns

## API Architecture

### Base URL
- Development: `http://localhost:3001/api/v1`
- Production: `https://api.production-tool.com/api/v1`

### Authentication
- JWT tokens via Clerk
- Bearer token in Authorization header
- Automatic token refresh

### REST Endpoints

#### Bookings
- `GET /api/v1/bookings` - List bookings with filters
- `POST /api/v1/bookings` - Create new booking
- `GET /api/v1/bookings/:id` - Get specific booking
- `PATCH /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Delete booking
- `POST /api/v1/bookings/check-availability` - Check availability

#### Artists
- `GET /api/v1/artists` - List artists
- `POST /api/v1/artists` - Create artist
- `GET /api/v1/artists/:id` - Get artist details
- `GET /api/v1/artists/:id/availability` - Get availability

#### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `GET /api/v1/projects/:id/bookings` - Get project bookings

## Real-Time Events

### Socket.IO Events
- `booking:created` - New booking created
- `booking:updated` - Booking modified
- `booking:deleted` - Booking removed
- `resource:updated` - Resource availability changed

### Event Handling
- Automatic store updates via Zustand
- Optimistic UI updates
- Conflict resolution

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set root directory to `apps/web`
3. Configure build command: `cd ../.. && pnpm build:web`
4. Set environment variables
5. Deploy automatically on push

### Backend (Railway/DigitalOcean)
1. Connect GitHub repository
2. Set root directory to `apps/api`
3. Configure build command: `cd ../.. && pnpm build:api`
4. Set start command: `node dist/main.js`
5. Configure environment variables
6. Set up PostgreSQL and Redis

### Docker Deployment
```bash
# Build images
docker build -f docker/Dockerfile.web -t production-tool-web .
docker build -f docker/Dockerfile.api -t production-tool-api .

# Run with docker-compose
docker-compose -f docker/docker-compose.prod.yml up
```

### CI/CD with GitHub Actions
The monorepo includes GitHub Actions workflows that:
- Detect changed packages
- Run tests only for affected apps
- Build and deploy only changed apps
- Manage staging and production environments

## Troubleshooting

### Common Issues

**Database Connection**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

**Authentication**
- Check Clerk environment variables
- Verify webhook endpoints
- Ensure middleware is configured

**Real-time Features**
- Verify Redis connection
- Check Socket.IO client configuration
- Ensure WebSocket support

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Follow TypeScript and ESLint rules
4. Write tests for new features
5. Submit pull request

## Security

- Environment variables are validated at runtime
- API routes are protected by Clerk authentication
- Database uses row-level security
- Input validation with Zod schemas
- Rate limiting on API endpoints

## Performance

- Optimistic updates for immediate feedback
- Virtual scrolling for large datasets
- Redis caching for frequently accessed data
- Database query optimization with proper indexing
- Image optimization with Next.js

## Monitoring

- Error tracking with Sentry
- Performance monitoring
- Database query analysis
- Real-time metrics dashboard