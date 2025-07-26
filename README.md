# Production Tool 2.0

A professional artist booking and project management platform designed for creative studios to efficiently allocate talent, manage schedules, and track project timelines.

## ⚠️ IMPORTANT: Pre-Development Phase

**This project is in the architecture and planning phase. No development has started yet.**

All documentation describes the planned implementation. Development will only begin after all architecture decisions are approved.

## 📚 Documentation

### Quick Navigation

| Audience | Time | Document | Purpose |
|----------|------|----------|----------|
| Technical Lead | 10 min | [Technical Overview](docs/technical-assessment.md) | High-level technical approach |
| Stakeholders | 20 min | [Technical Review](docs/technical-review.md) | Detailed technical understanding |
| Architects | 30 min | [Architecture](docs/architecture.md) | Complete system design |
| Developers | 15 min | [Setup Guide](docs/setup.md) | Development environment |

### All Documentation

- **[Technical Assessment](docs/technical-assessment.md)** - Technical implementation overview
- **[Technical Review](docs/technical-review.md)** - Detailed technical specifications
- **[Architecture](docs/architecture.md)** - Complete system architecture
- **[API Documentation](docs/api.md)** - API specifications and endpoints
- **[Figma Integration](docs/figma-integration.md)** - Design-to-code workflow
- **[Setup Guide](docs/setup.md)** - Development environment setup
- **[Project Structure](docs/guides/project-structure.md)** - Code organization
- **[CLAUDE.md](CLAUDE.md)** - AI assistant rules and standards

## Core Features

### 🎯 Artist Booking System
- **Conflict-free scheduling** with PostgreSQL GIST constraints
- **Hold/Pencil system** for tentative bookings
- **Real-time availability** updates across all users
- **Multi-tenant isolation** with row-level security

<!-- CLEM-IMPL: Additional artist features -->
- **Artist profiles** displays artist info referenced in bookings
- **Artist database** Search artists and create bookings

### 📊 Project Management
- **Gantt chart visualization** for project timelines
- **Phase dependencies** and milestone tracking
- **Resource allocation** across multiple projects
- **Progress tracking** with real-time updates

### ⚡ Real-time Collaboration
- **WebSocket-based** live updates
- **Event sourcing** for complete audit trail
- **Optimistic UI** for instant feedback
- **Multi-user conflict resolution**

<!-- CLEM-IMPL: Jobs listing feature needs specification -->
### 📋 Jobs Listing
- Feature specification needed

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.x (strict mode)
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20 LTS
- **API**: Next.js API Routes
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Caching**: Redis (multi-layer architecture)
- **Real-time**: Socket.IO with Redis adapter
- **Authentication**: Clerk

### Infrastructure
- **Frontend Hosting**: Vercel Edge Network
- **Database**: Neon (Serverless PostgreSQL)
- **Cache/Queue**: Railway Redis
- **Monitoring**: Sentry + Vercel Analytics

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│                Next.js 15 + TypeScript                      │
│             Tailwind CSS + Shadcn/ui + Zustand             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/WSS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                        │
│              (Frontend + API Routes)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Core                           │
│           Next.js API Routes + Middleware                   │
│         Clerk Auth + Drizzle ORM + Socket.IO               │
└─────────────┬──────────────────────┬────────────────────────┘
              │                      │
              ▼                      ▼
┌──────────────────────┐    ┌────────────────────────────┐
│   PostgreSQL (Neon)  │    │      Redis (Railway)       │
│   Primary Database   │    │   Cache + Message Queue    │
│   Multi-tenant RLS   │    │    Real-time Events        │
└──────────────────────┘    └────────────────────────────┘
```

## Database Design

### Core Tables
- **tenants**: Multi-tenant organization management

<!-- CLEM-Q: What are tenants in this context? -->

- **users**: User accounts with role-based access
- **artists**: Creative professionals (3D artists, animators, etc.)
- **projects**: Project tracking with phases and milestones
- **bookings**: Time allocations with conflict prevention
- **booking_events**: Event sourcing for audit trail

<!-- CLEM-IMPL: Add job listings to database schema -->
- **job_listings**: Jobs posted by studios on job listing platform

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
- Node.js 20+
- PostgreSQL 15+
- Redis
- Clerk account
- Figma account (for design integration)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd production-tool-2025

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── booking/          # Booking-specific components
│   └── project/          # Project management components
├── lib/                   # Utilities and configurations
│   ├── db/               # Database schema and client
│   ├── cache/            # Caching layer
│   └── realtime/         # WebSocket configuration
├── modules/              # Domain modules
│   ├── booking/          # Booking logic
│   ├── artist/           # Artist management
│   └── project/          # Project management
└── types/                # TypeScript definitions
```

<!-- CLEM-ARCH: Add job listings module to project structure -->

## Development Workflow

### Database Changes
1. Update schema in `src/lib/db/schema-enhanced.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`

### Component Development
1. Design component in Figma
2. Use Figma Dev Mode to extract specs
3. Generate component with Claude/Cursor
4. Implement business logic

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical workflows

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

<!-- CLEM-SEC: Create architecture without super admins - no access without explicit permission -->

### Data Protection
- Row-level security for multi-tenancy
- Input validation with Zod
- SQL injection prevention
- HTTPS-only in production

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

## Contributing

1. Create feature branch
2. Implement changes with tests
3. Ensure TypeScript strict mode compliance
4. Submit PR with detailed description

## License

[License Type] - See LICENSE file for details

---

**Production Tool 2.0** - Built with modern web technologies for creative studios.