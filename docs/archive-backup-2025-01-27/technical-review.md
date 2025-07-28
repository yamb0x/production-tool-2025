# Production Tool 2.0 - Technical Review Document
*Resource Booking System for Production Teams*

---

## Project Overview

**Production Tool 2.0** is a resource booking platform that enables teams to efficiently allocate resources to projects based on availability. The system focuses on preventing booking conflicts and providing real-time visibility into resource availability across all active projects.

### Current Status
- Database schema implemented with conflict-free booking constraints
- Basic API structure in place
- Architecture documented following modular monolith pattern
- UI workflow defined using Figma-to-code MCP integration
- Minimal code implementation (~10% complete)

---

## 1. System Architecture

### Technology Stack Selection

#### Core Framework: Next.js 15 with TypeScript
- **Rationale**: Unified full-stack framework reduces complexity for 2-person team
- **Benefits**: Built-in API routes, SSR/SSG capabilities, excellent DX
- **TypeScript**: Provides type safety crucial for booking logic integrity

#### Database: PostgreSQL with Drizzle ORM
- **PostgreSQL**: Chosen for its advanced constraint capabilities
- **Exclusion Constraints**: Native support for preventing booking overlaps at database level
- **Drizzle ORM**: Type-safe, performant, with excellent migration support
- **Row-Level Security**: Built-in multi-tenant isolation

#### Real-time: Socket.IO
- **Rationale**: Mature, battle-tested WebSocket abstraction
- **Features**: Automatic reconnection, room-based broadcasting
- **Use Case**: Instant booking updates across all connected clients

#### State Management: Zustand
- **Rationale**: Lightweight, TypeScript-first, minimal boilerplate
- **Features**: Optimistic updates for responsive UI
- **Integration**: Works seamlessly with React Server Components

#### Authentication: Clerk
- **Rationale**: Managed auth service reduces development time
- **Features**: SSO, MFA, user management out-of-box
- **Integration**: Native Next.js middleware support

### Architectural Pattern: Modular Monolith

```
src/
├── app/                    # Next.js app directory
├── modules/               # Business logic modules
│   ├── booking/          # Artist booking domain
│   ├── artist/           # Artist management
│   ├── project/          # Project & budget tracking
│   └── tenant/           # Multi-tenant logic
├── lib/                   # Shared utilities
└── services/             # External integrations
```

**Benefits of this approach:**
- Clear separation of concerns
- Easy to understand and maintain
- Can extract to microservices later if needed
- AI tools can easily navigate and modify

---

## 2. Core System Design

### Database Schema

#### Key Tables
- **resources**: Resource profiles with capabilities and metadata
- **projects**: Client projects with budgets and timelines
- **bookings**: Resource allocations to projects with time ranges
- **availability**: Resource availability windows
- **tenants**: Studio/company isolation

#### Conflict Prevention
```sql
-- PostgreSQL exclusion constraint prevents double-booking
ALTER TABLE bookings 
ADD CONSTRAINT no_double_booking 
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status = 'confirmed');
```

This constraint guarantees at the database level that no resource can be booked for overlapping time periods.

### API Design

#### RESTful Endpoints
- `GET /api/resources/availability` - Check resource availability
- `POST /api/bookings` - Create new booking with conflict check
- `GET /api/projects/:id/status` - Track project status
- `PATCH /api/bookings/:id` - Modify existing bookings

#### Real-time Events
- `booking:created` - Broadcast new bookings
- `booking:updated` - Notify booking changes
- `artist:availability_changed` - Update availability status

---

## 3. Development Workflow

### Figma to Code Pipeline

1. **Design System in Figma**
   - Components organized by atomic design principles
   - Design tokens for consistent theming
   - Variants for all component states

2. **MCP Integration**
   - Automated extraction of design tokens
   - Component structure analysis
   - Generation of TypeScript interfaces

3. **Code Generation**
   - Shadcn/ui components as base
   - Custom styling via Tailwind classes
   - Preservation of Figma constraints

### AI-Assisted Development

**Tools Integration:**
- Claude for architecture decisions and complex logic
- GitHub Copilot for repetitive code patterns
- MCP servers for design-to-code automation

**Benefits:**
- 3x faster development for CRUD operations
- Consistent code patterns across modules
- Reduced human error in booking logic

---

## 4. Data Flow Architecture

### Booking Creation Flow

1. **Client Request**
   - User selects artist, project, and time range
   - Frontend performs optimistic update

2. **Validation Layer**
   - Check artist availability
   - Verify project budget constraints
   - Validate user permissions

3. **Database Transaction**
   - Insert booking record
   - Update project budget allocation
   - PostgreSQL constraint ensures no conflicts

4. **Real-time Broadcast**
   - Socket.IO emits update to relevant clients
   - UI updates across all connected users

### State Synchronization

```typescript
// Zustand store with optimistic updates
const useBookingStore = create((set) => ({
  bookings: [],
  createBooking: async (booking) => {
    // Optimistic update
    set(state => ({ 
      bookings: [...state.bookings, { ...booking, pending: true }] 
    }));
    
    try {
      const confirmed = await api.createBooking(booking);
      // Replace optimistic with confirmed
      set(state => ({
        bookings: state.bookings.map(b => 
          b.id === booking.id ? confirmed : b
        )
      }));
    } catch (error) {
      // Rollback on failure
      set(state => ({
        bookings: state.bookings.filter(b => b.id !== booking.id)
      }));
    }
  }
}));
```

---

## 5. Security & Multi-tenancy

### Row-Level Security (RLS)

```sql
-- Ensure users only see their studio's data
CREATE POLICY studio_isolation ON bookings
  FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### API Security
- JWT tokens via Clerk
- Tenant ID injection in middleware
- Rate limiting per tenant
- Input validation with Zod schemas

---

## 6. Performance Considerations

### Optimization Strategies

1. **Database Indexes**
   - Composite indexes on (artist_id, start_time)
   - Partial indexes for active bookings
   - GiST indexes for range queries

2. **Caching Layer** (Planned)
   - Redis for availability queries
   - 5-minute TTL for artist schedules
   - Cache invalidation on booking changes

3. **Frontend Performance**
   - React Server Components for initial load
   - Virtualized lists for large datasets
   - Optimistic UI updates

---

## 7. Testing Strategy

### Test Categories

1. **Unit Tests**
   - Booking conflict logic
   - Budget calculation algorithms
   - Date/time utilities

2. **Integration Tests**
   - API endpoint validation
   - Database constraint verification
   - WebSocket event flow

3. **E2E Tests** (Planned)
   - Complete booking workflows
   - Multi-user conflict scenarios
   - Real-time synchronization

---

## 8. Deployment Architecture

### Infrastructure
- **Hosting**: Vercel for Next.js application
- **Database**: Neon (Serverless PostgreSQL)
- **WebSockets**: Dedicated Socket.IO server
- **File Storage**: Cloudflare R2 (if needed)

### Scaling Considerations
- Horizontal scaling via Vercel
- Database connection pooling
- WebSocket server clustering
- CDN for static assets

---

## 9. Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|---------|--------|
| Architecture | Modular Monolith | Simplicity, clear boundaries, future flexibility |
| Database | PostgreSQL | Advanced constraints, RLS, proven reliability |
| Framework | Next.js 15 | Full-stack, great DX, strong ecosystem |
| Real-time | Socket.IO | Mature, reliable, easy clustering |
| Auth | Clerk | Reduces dev time, enterprise features |
| UI Workflow | Figma + MCP | Single source of truth, automation |
| State | Zustand | Simple, performant, TypeScript-first |

---

## 10. Next Steps

### Immediate Priorities
1. Complete booking module implementation
2. Implement real-time WebSocket server
3. Build core UI components from Figma
4. Add comprehensive error handling
5. Create booking conflict test suite

### Architecture Improvements
1. Implement repository pattern
2. Add domain event system
3. Create API versioning strategy
4. Design backup/recovery procedures
5. Plan monitoring integration

---

*This document represents the current technical state of the D1 platform. Focus is on practical implementation details and architectural decisions made for efficient development by a small team.*
