# Production Tool 2.0

A professional artist booking and project management platform designed for creative studios to efficiently allocate talent, manage schedules, and track project timelines with real-time collaboration.

## 🚀 Project Status: Ready for Implementation

**Architecture Approved** ✅ - The project architecture and design have been completed and approved. Development can begin following the implementation guide.

## 📚 Documentation Hub

### Essential Guides (Start Here)

| Priority | Document | Purpose | Time |
|----------|----------|---------|------|
| 1️⃣ | [Setup Guide](docs/setup-guide.md) | Get your development environment running | 30 min |
| 2️⃣ | [Development Workflow](docs/development-workflow.md) | AI-assisted development practices | Read first |
| 3️⃣ | [Monorepo Guide](docs/monorepo-guide.md) | Understand the codebase organization | 15 min |
| 4️⃣ | [Tools Stack](docs/tools-stack.md) | Complete tools and technology reference | 20 min |

### Technical Reference

| Document | Purpose |
|----------|---------|
| [Architecture Guide](docs/architecture-guide.md) | Complete system design and technical architecture |
| [Security Guide](docs/security-guide.md) | Zero-trust security implementation and best practices |
| [Technical Decisions](docs/technical-decisions.md) | All architectural decisions with rationale |
| [Implementation Roadmap](docs/implementation-roadmap.md) | Development timeline and milestones |

### AI Development

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | AI assistant rules and project context |
| [Specialized Agents](.claude/agents/) | Domain-specific AI agents for development |

## Core Features

### Artist Booking System
- **Conflict-free scheduling** with intelligent booking detection
- **Hold/Pencil system** for tentative bookings
- **Real-time availability** updates across all users
- **Multi-tenant isolation** with row-level security

### Artist Features
- **Artist profiles** with portfolios, experience, and availability management
- **Artist database** searchable by skills, availability, and location
- **Skill matching** for project requirements
- **Performance tracking** with booking history and ratings

### Project Management
- **Gantt chart visualization** for project timelines
- **Phase dependencies** and milestone tracking
- **Resource allocation** across multiple projects
- **Progress tracking** with real-time updates

### Real-time Collaboration
- **WebSocket-based** live updates
- **Event sourcing** for complete audit trail
- **Optimistic UI** for instant feedback
- **Multi-user conflict resolution**

### Jobs Marketplace
- **Job postings** for studios to advertise opportunities
- **Application management** with status tracking
- **Skill-based matching** to connect artists with relevant jobs
- **Saved jobs** for artists to track opportunities

## Technology Stack

### Frontend (apps/web)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.x (strict mode)
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Real-time**: Socket.IO Client
- **API Client**: Type-safe with shared types

### Backend (apps/api)
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: MongoDB 7 with Mongoose ODM
- **Caching**: Redis (multi-layer architecture)
- **Real-time**: Socket.IO with Redis adapter
- **Authentication**: Clerk with JWT
- **Documentation**: OpenAPI/Swagger
- **Queue**: Bull for background jobs

### Shared Packages
- **@production-tool/shared-types**: TypeScript interfaces
- **@production-tool/ui**: Reusable UI components
- **@production-tool/utils**: Common utilities
- **@production-tool/config**: Shared configurations

### Infrastructure
- **Monorepo**: Turborepo with pnpm
- **Frontend Hosting**: Vercel Edge Network
- **Backend Hosting**: Railway/DigitalOcean
- **Database**: MongoDB Atlas (Managed MongoDB)
- **Cache/Queue**: Railway Redis
- **File Storage**: Cloudflare R2
- **Monitoring**: Sentry + OpenTelemetry
- **CI/CD**: GitHub Actions

## Architecture Overview

The system follows a **separated frontend/backend architecture** with a monorepo structure:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│                Next.js 15 + TypeScript                      │
│             Tailwind CSS + Shadcn/ui + Zustand             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                        │
│                  (Frontend Only - SSR/SSG)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ API Calls (HTTPS/WSS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Backend API                       │
│                  Railway/DigitalOcean                       │
│         REST API + Socket.IO + Background Jobs              │
│         Clerk Auth + Mongoose ODM + Business Logic         │
└─────────────┬──────────────────────┬────────────────────────┘
              │                      │
              ▼                      ▼
┌──────────────────────┐    ┌────────────────────────────┐
│   MongoDB (Atlas)    │    │      Redis (Railway)       │
│   Primary Database   │    │   Cache + Message Queue    │
│   Multi-tenant RLS   │    │    Real-time Events        │
└──────────────────────┘    └────────────────────────────┘
```

## Database Design

### Core Tables
- **tenants**: Multi-tenant organization management

> **Note**: Tenants are studios/organizations - each with isolated data and users

- **users**: User accounts with role-based access
- **artists**: Creative professionals (3D artists, animators, etc.)
- **projects**: Project tracking with phases and milestones
- **bookings**: Time allocations with conflict prevention
- **booking_events**: Event sourcing for audit trail

- **job_listings**: Jobs posted by studios on job listing platform
- **job_applications**: Artist applications with status tracking
- **artist_profiles**: Enhanced artist information and portfolios
- **data_version_history**: Complete audit trail and version control
- **backup_snapshots**: Automated backup tracking

### Key Features
- **GIST Exclusion Constraints**: Prevents double-booking at database level
- **Event Sourcing**: Complete history of all changes
- **Row-Level Security**: Tenant data isolation
- **Optimistic Locking**: Handles concurrent updates

## Figma Integration

The project supports design-to-code workflow using:

### Figma MCP (Model Context Protocol)
- Connect Figma designs directly to Claude
- Extract component specifications
- Generate React components from designs

### Figma Code Connect
- Link Figma components to code components
- Type-safe prop mappings
- Framework-specific code generation

### Setup
1. Install Figma desktop app
2. Configure MCP server connection
3. Use Figma Dev Mode for component extraction

## Getting Started

### Prerequisites
- Node.js 20+ LTS
- pnpm 8+ (required for monorepo)
- Docker Desktop (for MongoDB and Redis) or local MongoDB installation
- Git
- Clerk account (free tier works)

### Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd production-tool-2025

# Install pnpm if needed
npm install -g pnpm@8

# Install all dependencies
pnpm install

# Start Docker services (MongoDB + Redis)
docker-compose up -d

# Set up environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local

# Run database migrations
pnpm db:migrate

# Start development (frontend + backend)
pnpm dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

### Key Environment Variables

```env
# Frontend (apps/web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend (apps/api/.env.local)
MONGODB_URI=mongodb://localhost:27017/production_tool
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_test_...
```

For complete setup instructions, see the [Setup Guide](docs/setup.md).

## Monorepo Structure

This project uses **Turborepo** with **pnpm workspaces** for efficient monorepo management:

```
production-tool/
├── apps/                          # Applications (deployable)
│   ├── web/                      # Next.js frontend
│   │   ├── src/app/             # App Router pages
│   │   ├── src/components/      # React components
│   │   └── src/lib/             # Frontend utilities
│   │
│   └── api/                      # NestJS backend
│       ├── src/modules/         # Feature modules
│       ├── src/common/          # Shared utilities
│       └── src/database/        # Database layer
│
├── packages/                      # Shared packages (internal)
│   ├── shared-types/            # TypeScript interfaces
│   ├── ui/                      # Reusable UI components
│   ├── utils/                   # Common utilities
│   └── config/                  # Shared configs (ESLint, TS)
│
├── docs/                         # All documentation
│   ├── architecture/            # System design docs
│   ├── api/                     # API specifications
│   └── guides/                  # Developer guides
│
├── docker/                       # Docker configurations
├── scripts/                      # Automation scripts
└── turbo.json                   # Turborepo configuration
```

For detailed structure, see the [Project Structure Guide](docs/guides/project-structure.md).

## Development Commands

```bash
# Development
pnpm dev                # Start all apps in dev mode
pnpm dev:web           # Frontend only
pnpm dev:api           # Backend only

# Database
pnpm db:generate       # Generate migrations
pnpm db:migrate        # Apply migrations
pnpm db:seed           # Seed sample data
# Use MongoDB Compass for database visualization

# Testing
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report

# Code Quality
pnpm lint              # Lint all packages
pnpm type-check        # TypeScript checks
pnpm format            # Format with Prettier

# Building
pnpm build             # Build all apps
pnpm build:web         # Build frontend
pnpm build:api         # Build backend
```

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** following the coding standards
3. **Write tests** for your changes
4. **Run checks**: `pnpm lint && pnpm test`
5. **Create PR** with detailed description

For complete workflow details, see the [Development Workflow Guide](docs/guides/development-workflow.md).

## Performance Optimizations

### Caching Strategy
- **L1**: In-memory cache (application)
- **L2**: Redis shared cache
- **L3**: CDN edge cache

### Database Optimizations
- Composite indexes for common queries
- Materialized views for analytics
- Connection pooling

### Frontend Optimizations
- React Server Components
- Code splitting
- Optimistic updates
- Virtual scrolling for large lists

## Security

### Authentication & Authorization
- Clerk handles user authentication
- Role-based access control (RBAC)
- API routes protected by middleware

### Zero-Trust Architecture
- **No Super Admins**: Complete isolation between tenants
- **Row-Level Security**: Enforced at database level
- **Tenant Guards**: Every request validated for tenant context
- **Audit Trail**: Complete logging of all access attempts

### Data Protection
- **Input Validation**: Zod schemas for all data
- **Rate Limiting**: API protection against abuse
- **CSRF Protection**: Built into framework
- **Content Security Policy**: XSS prevention
- **Encryption**: At-rest and in-transit

### Backup & Recovery
- **Version History**: Every change tracked and reversible
- **Point-in-Time Recovery**: Restore to any moment
- **Daily Snapshots**: Automated full backups
- **Tenant-Specific Exports**: Individual studio backups
- **Regular Testing**: Automated recovery verification

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] Clerk authentication configured
- [ ] Monitoring setup (Sentry)
- [ ] SSL certificates configured

### Scaling Considerations
- Horizontal scaling with Redis adapter
- Database read replicas
- CDN for static assets
- Edge functions for global performance

## API Overview

The backend provides a comprehensive REST API with:

- **RESTful endpoints** for all resources
- **Real-time updates** via WebSocket
- **Type-safe contracts** with OpenAPI/Swagger
- **Multi-tenant isolation** at all levels
- **Rate limiting** and security

Key endpoints:
- `/api/v1/artists` - Artist management
- `/api/v1/bookings` - Booking operations
- `/api/v1/projects` - Project management
- `/api/v1/jobs` - Job marketplace

See the complete [API Design Document](docs/api/api-design.md) for details.

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Architecture design
- [x] Database schema
- [x] Documentation
- [ ] Monorepo setup
- [ ] Basic infrastructure

### Phase 2: Core Features (Weeks 2-4)
- [ ] Authentication (Clerk)
- [ ] Booking system
- [ ] Artist management
- [ ] Real-time updates

### Phase 3: Enhanced Features (Weeks 5-6)
- [ ] Artist profiles
- [ ] Job marketplace
- [ ] Project Gantt charts
- [ ] Notifications

### Phase 4: Production (Weeks 7-8)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Testing & QA
- [ ] Deployment

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please ensure:
- All tests pass (`pnpm test`)
- Code follows our standards (`pnpm lint`)
- TypeScript strict mode compliance
- Documentation is updated

## Team

This project is developed by a 2-person team with AI-assisted development:
- **Architecture & Backend**: Lead Developer
- **Frontend & UI/UX**: Frontend Developer
- **AI Assistance**: Claude/Cursor for rapid development

## License

[License Type] - See LICENSE file for details

---

<div align="center">
  <strong>Production Tool 2.0</strong><br>
  Built with ❤️ using modern web technologies for creative studios<br>
  <br>
  <a href="docs/setup.md">Get Started</a> •
  <a href="docs/architecture.md">Architecture</a> •
  <a href="docs/api/api-design.md">API Docs</a> •
  <a href="docs/guides/development-workflow.md">Contributing</a>
</div>