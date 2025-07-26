# Production Tool 2025 - Setup Guide

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (for real-time features)
- Git

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd production-tool-2025
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables:**
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/production_tool"
   
   # Auth (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # API
   NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # Redis (for real-time features)
   REDIS_URL=redis://localhost:6379
   ```

4. **Database setup:**
   ```bash
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## Tech Stack Overview

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library built on Radix UI
- **Zustand** - Lightweight state management
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Next.js API Routes** - Backend API endpoints
- **Clerk** - Authentication and user management
- **Drizzle ORM** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and real-time message queue
- **Socket.IO** - Real-time communication

### Infrastructure
- **Vercel** - Frontend hosting and deployment
- **Railway** - Backend hosting (optional)
- **Neon** - Managed PostgreSQL
- **Cloudflare R2** - File storage
- **GitHub Actions** - CI/CD pipeline

## Project Structure

```
production-tool-2025/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/v1/            # API endpoints
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── bookings/          # Booking management
│   │   ├── resources/         # Resource management
│   │   └── projects/          # Project management
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (Shadcn)
│   │   ├── booking/          # Booking-specific components
│   │   ├── resource/         # Resource-specific components
│   │   └── project/          # Project-specific components
│   ├── lib/                   # Utilities and configurations
│   │   ├── db/               # Database schema and connection
│   │   ├── auth/             # Authentication utilities
│   │   ├── api/              # API client
│   │   ├── socket/           # Socket.IO client
│   │   ├── stores/           # Zustand stores
│   │   └── utils/            # Helper functions
│   ├── types/                # TypeScript type definitions
│   └── hooks/                # Custom React hooks
├── docs/                     # Documentation
├── drizzle/                  # Database migrations
├── public/                   # Static assets
└── .github/workflows/        # CI/CD configuration
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

## API Endpoints

### Authentication
- Handled automatically by Clerk middleware
- All `/api/v1/*` routes are protected

### Bookings
- `GET /api/v1/bookings` - List bookings with filters
- `POST /api/v1/bookings` - Create new booking
- `PATCH /api/v1/bookings/[id]` - Update booking
- `DELETE /api/v1/bookings/[id]` - Delete booking
- `POST /api/v1/bookings/check-availability` - Check availability

### Resources
- `GET /api/v1/resources` - List resources
- `POST /api/v1/resources` - Create resource

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project

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

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push to main

### Railway (Backend Alternative)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy PostgreSQL and Redis services

### Manual Deployment
```bash
npm run build
npm start
```

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