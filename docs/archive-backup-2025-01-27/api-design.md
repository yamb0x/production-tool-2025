# API Design Document - Production Tool 2.0

This document defines the complete REST API specification for Production Tool 2.0, including endpoints, request/response formats, authentication, and real-time events.

## API Overview

### Base URLs
- **Development**: `http://localhost:3001/api/v1`
- **Staging**: `https://api-staging.production-tool.com/api/v1`
- **Production**: `https://api.production-tool.com/api/v1`

### API Versioning
- Version included in URL path: `/api/v1/`
- Future versions: `/api/v2/`
- Deprecation notice: 6 months minimum

### Authentication
All API requests require authentication via Bearer token:
```
Authorization: Bearer <clerk-jwt-token>
```

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
X-Tenant-ID: <tenant-uuid> (optional, derived from user)
```

### Response Format
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}
```

## Core Resources

### 1. Authentication & Users

#### POST /api/v1/auth/webhook
Clerk webhook endpoint for user synchronization
```json
// Headers
{
  "svix-id": "msg_...",
  "svix-timestamp": "1234567890",
  "svix-signature": "..."
}

// Request (Clerk Event)
{
  "type": "user.created",
  "data": { /* Clerk user object */ }
}

// Response
204 No Content
```

#### GET /api/v1/users/me
Get current user profile
```json
// Response
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager",
    "tenantId": "uuid",
    "avatar": "https://...",
    "settings": {
      "notifications": { /* ... */ }
    }
  }
}
```

### 2. Tenants

#### GET /api/v1/tenants/current
Get current tenant information
```json
// Response
{
  "data": {
    "id": "uuid",
    "name": "Studio XYZ",
    "type": "studio",
    "settings": {
      "timezone": "America/New_York",
      "workingHours": {
        "start": "09:00",
        "end": "18:00"
      },
      "bookingRules": { /* ... */ }
    }
  }
}
```

### 3. Artists

#### GET /api/v1/artists
List all artists in tenant
```json
// Query Parameters
?type=3d_artist,animator
&isActive=true
&isFreelancer=false
&search=john
&page=1
&limit=20
&sort=name:asc,createdAt:desc

// Response
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "3d_artist",
      "skills": ["Maya", "Blender", "ZBrush"],
      "hourlyRate": "75.00",
      "dailyRate": "600.00",
      "isActive": true,
      "isFreelancer": false,
      "availability": {
        "status": "available",
        "nextAvailable": null
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

#### POST /api/v1/artists
Create new artist
```json
// Request
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "type": "animator",
  "skills": ["Maya", "After Effects"],
  "hourlyRate": 80,
  "dailyRate": 640,
  "isFreelancer": true
}

// Response
{
  "data": {
    "id": "uuid",
    /* ... artist object ... */
  }
}
```

#### GET /api/v1/artists/:id
Get artist details
```json
// Response
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "3d_artist",
    "profile": {
      "bio": "Experienced 3D artist...",
      "portfolio": [ /* ... */ ],
      "experience": [ /* ... */ ]
    },
    "stats": {
      "completedProjects": 42,
      "totalHoursBooked": 1680,
      "averageRating": 4.8
    }
  }
}
```

#### GET /api/v1/artists/:id/availability
Get artist availability
```json
// Query Parameters
?startDate=2024-01-01
&endDate=2024-01-31

// Response
{
  "data": {
    "artistId": "uuid",
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "availability": [
      {
        "date": "2024-01-15",
        "slots": [
          {
            "start": "09:00",
            "end": "12:00",
            "available": true
          },
          {
            "start": "13:00",
            "end": "17:00",
            "available": false,
            "booking": {
              "id": "uuid",
              "title": "Project X",
              "status": "confirmed"
            }
          }
        ]
      }
    ]
  }
}
```

### 4. Bookings

#### GET /api/v1/bookings
List bookings with filters
```json
// Query Parameters
?artistId=uuid
&projectId=uuid
&status=confirmed,pencil
&startDate=2024-01-01
&endDate=2024-01-31
&page=1
&limit=50

// Response
{
  "data": [
    {
      "id": "uuid",
      "artistId": "uuid",
      "artist": {
        "id": "uuid",
        "name": "John Doe"
      },
      "projectId": "uuid",
      "project": {
        "id": "uuid",
        "name": "Project X"
      },
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T17:00:00Z",
      "status": "confirmed",
      "title": "Character Modeling",
      "notes": "Focus on main character",
      "rate": "80.00",
      "rateType": "hourly",
      "totalAmount": "640.00"
    }
  ],
  "meta": { /* ... */ }
}
```

#### POST /api/v1/bookings
Create new booking
```json
// Request
{
  "artistId": "uuid",
  "projectId": "uuid",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "status": "pencil",
  "holdType": "soft",
  "title": "Character Modeling",
  "notes": "Initial modeling phase",
  "rate": 80,
  "rateType": "hourly"
}

// Response
{
  "data": {
    "id": "uuid",
    /* ... booking object ... */
  }
}

// Error Response (Conflict)
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Artist is already booked for this time period",
    "details": {
      "conflictingBooking": {
        "id": "uuid",
        "title": "Other Project",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T14:00:00Z"
      }
    }
  }
}
```

#### POST /api/v1/bookings/check-availability
Check availability before booking
```json
// Request
{
  "artistId": "uuid",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z"
}

// Response
{
  "data": {
    "available": false,
    "conflicts": [
      {
        "id": "uuid",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T14:00:00Z",
        "status": "confirmed"
      }
    ],
    "suggestions": [
      {
        "startTime": "2024-01-16T09:00:00Z",
        "endTime": "2024-01-16T17:00:00Z"
      }
    ]
  }
}
```

#### PATCH /api/v1/bookings/:id
Update booking
```json
// Request
{
  "status": "confirmed",
  "notes": "Updated notes"
}

// Response
{
  "data": {
    "id": "uuid",
    /* ... updated booking ... */
  }
}
```

#### POST /api/v1/bookings/:id/convert
Convert hold to confirmed
```json
// Request
{
  "notes": "Client approved"
}

// Response
{
  "data": {
    "id": "uuid",
    "status": "confirmed",
    /* ... booking ... */
  }
}
```

### 5. Projects

#### GET /api/v1/projects
List projects
```json
// Query Parameters
?status=active,planning
&search=video
&clientName=ABC
&startDate=2024-01-01
&page=1
&limit=20

// Response
{
  "data": [
    {
      "id": "uuid",
      "name": "Summer Campaign",
      "code": "SUM-2024",
      "description": "Video campaign for summer collection",
      "status": "active",
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "budget": "50000.00",
      "clientName": "ABC Corp",
      "progress": 35,
      "team": {
        "count": 8,
        "members": [ /* ... */ ]
      }
    }
  ],
  "meta": { /* ... */ }
}
```

#### POST /api/v1/projects
Create new project
```json
// Request
{
  "name": "Winter Campaign",
  "code": "WIN-2024",
  "description": "Winter collection video",
  "status": "planning",
  "startDate": "2024-02-01",
  "endDate": "2024-04-30",
  "budget": 75000,
  "clientName": "XYZ Inc"
}

// Response
{
  "data": {
    "id": "uuid",
    /* ... project object ... */
  }
}
```

#### GET /api/v1/projects/:id/phases
Get project phases (Gantt data)
```json
// Response
{
  "data": [
    {
      "id": "uuid",
      "name": "Pre-production",
      "startDate": "2024-01-01",
      "endDate": "2024-01-15",
      "progress": 100,
      "dependencies": [],
      "color": "#4CAF50"
    },
    {
      "id": "uuid",
      "name": "Production",
      "startDate": "2024-01-16",
      "endDate": "2024-02-28",
      "progress": 45,
      "dependencies": ["pre-production-id"],
      "color": "#2196F3"
    }
  ]
}
```

#### GET /api/v1/projects/:id/bookings
Get project bookings
```json
// Response
{
  "data": [
    {
      "id": "uuid",
      "artist": {
        "id": "uuid",
        "name": "John Doe",
        "type": "3d_artist"
      },
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T17:00:00Z",
      "status": "confirmed",
      "title": "Character Modeling"
    }
  ]
}
```

### 6. Jobs (Job Marketplace)

#### GET /api/v1/jobs
List job postings
```json
// Query Parameters
?status=open
&type=full_time,contract
&artistType=3d_artist
&location=New York
&isRemote=true
&rateMin=50
&rateMax=150
&search=senior
&page=1
&limit=20

// Response
{
  "data": [
    {
      "id": "uuid",
      "title": "Senior 3D Artist",
      "description": "We're looking for an experienced...",
      "type": "full_time",
      "artistType": "3d_artist",
      "status": "open",
      "location": "New York, NY",
      "isRemote": true,
      "rateMin": "80.00",
      "rateMax": "120.00",
      "rateType": "hourly",
      "skills": ["Maya", "ZBrush", "Substance"],
      "applicationDeadline": "2024-02-01",
      "viewCount": 234,
      "applicationCount": 12,
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": { /* ... */ }
}
```

#### POST /api/v1/jobs
Create job posting
```json
// Request
{
  "title": "Character Animator",
  "description": "Join our team...",
  "requirements": "5+ years experience...",
  "responsibilities": "Create character animations...",
  "type": "contract",
  "artistType": "animator",
  "location": "Los Angeles, CA",
  "isRemote": true,
  "rateMin": 70,
  "rateMax": 100,
  "rateType": "hourly",
  "startDate": "2024-03-01",
  "duration": "3-6 months",
  "skills": ["Maya", "Motion Capture"],
  "applicationDeadline": "2024-02-20"
}

// Response
{
  "data": {
    "id": "uuid",
    /* ... job object ... */
  }
}
```

#### POST /api/v1/jobs/:id/apply
Apply for job
```json
// Request
{
  "coverLetter": "I am excited to apply...",
  "resumeUrl": "https://storage.example.com/resume.pdf",
  "portfolioUrl": "https://portfolio.example.com",
  "availableFrom": "2024-03-01",
  "expectedRate": 85
}

// Response
{
  "data": {
    "id": "uuid",
    "jobListingId": "uuid",
    "artistId": "uuid",
    "status": "pending",
    "appliedAt": "2024-01-20T14:30:00Z"
  }
}
```

#### GET /api/v1/jobs/:id/applications
Get job applications (admin only)
```json
// Query Parameters
?status=pending,reviewing
&page=1
&limit=20

// Response
{
  "data": [
    {
      "id": "uuid",
      "artist": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "type": "animator"
      },
      "status": "reviewing",
      "coverLetter": "I am excited...",
      "resumeUrl": "https://...",
      "portfolioUrl": "https://...",
      "expectedRate": "85.00",
      "appliedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "meta": { /* ... */ }
}
```

## Real-time Events (WebSocket)

### Connection
```javascript
// Frontend connection
const socket = io('http://localhost:3001', {
  auth: {
    token: 'clerk-jwt-token'
  }
});

// Join tenant room
socket.emit('join-tenant', { tenantId: 'uuid' });
```

### Event Types

#### Booking Events
```javascript
// booking:created
{
  type: 'booking:created',
  data: {
    booking: { /* booking object */ },
    userId: 'uuid'
  }
}

// booking:updated
{
  type: 'booking:updated',
  data: {
    booking: { /* updated booking */ },
    changes: { /* what changed */ },
    userId: 'uuid'
  }
}

// booking:deleted
{
  type: 'booking:deleted',
  data: {
    bookingId: 'uuid',
    userId: 'uuid'
  }
}
```

#### Artist Events
```javascript
// artist:availability:changed
{
  type: 'artist:availability:changed',
  data: {
    artistId: 'uuid',
    availability: { /* new availability */ }
  }
}
```

#### Project Events
```javascript
// project:updated
{
  type: 'project:updated',
  data: {
    project: { /* project object */ },
    changes: { /* what changed */ }
  }
}

// project:phase:updated
{
  type: 'project:phase:updated',
  data: {
    projectId: 'uuid',
    phase: { /* phase object */ }
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      /* Additional context */
    },
    "timestamp": "2024-01-20T10:30:00Z",
    "path": "/api/v1/bookings"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `BOOKING_CONFLICT` - Booking time conflict
- `TENANT_MISMATCH` - Cross-tenant access attempt
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

### Limits
- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Premium**: 1000 requests/minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

## Pagination

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field and order (e.g., `name:asc,createdAt:desc`)

### Response Meta
```json
{
  "meta": {
    "total": 245,
    "page": 3,
    "limit": 20,
    "hasMore": true
  },
  "links": {
    "self": "/api/v1/bookings?page=3&limit=20",
    "next": "/api/v1/bookings?page=4&limit=20",
    "prev": "/api/v1/bookings?page=2&limit=20"
  }
}
```

## Filtering & Searching

### Filter Operators
- Equals: `?status=confirmed`
- In: `?status=confirmed,pencil`
- Range: `?rateMin=50&rateMax=150`
- Date range: `?startDate=2024-01-01&endDate=2024-01-31`
- Boolean: `?isActive=true`
- Search: `?search=john` (searches multiple fields)

### Nested Filtering
- `?artist.type=3d_artist`
- `?project.status=active`

## API Versioning Strategy

### Version Lifecycle
1. **Beta**: `/api/v1-beta/` - May have breaking changes
2. **Stable**: `/api/v1/` - No breaking changes
3. **Deprecated**: 6-month notice before removal
4. **Sunset**: Returns 410 Gone

### Version Headers
```http
X-API-Version: 1.0
X-API-Deprecation: 2024-12-31
```

## Security Considerations

### Authentication
- JWT tokens via Clerk
- Token expiration: 1 hour
- Refresh tokens: 7 days

### Authorization
- Role-based access control (RBAC)
- Tenant isolation at all levels
- Resource-level permissions

### Data Security
- All responses filtered by tenant
- No cross-tenant data access
- Sensitive fields excluded from responses

### Rate Limiting
- Per-user rate limits
- Distributed rate limiting with Redis
- Exponential backoff for retries

## SDK Examples

### TypeScript/JavaScript
```typescript
import { ProductionToolAPI } from '@production-tool/sdk';

const api = new ProductionToolAPI({
  baseURL: 'https://api.production-tool.com',
  token: 'your-token'
});

// Create booking
const booking = await api.bookings.create({
  artistId: 'uuid',
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T17:00:00Z'),
  title: 'Character Modeling'
});

// Check availability
const availability = await api.bookings.checkAvailability({
  artistId: 'uuid',
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T17:00:00Z')
});
```

### cURL Examples
```bash
# Get bookings
curl -X GET "https://api.production-tool.com/api/v1/bookings" \
  -H "Authorization: Bearer your-token" \
  -H "Accept: application/json"

# Create booking
curl -X POST "https://api.production-tool.com/api/v1/bookings" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "uuid",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T17:00:00Z",
    "title": "Character Modeling"
  }'
```

## Testing the API

### Postman Collection
Import the Postman collection from `docs/api/postman/production-tool.postman_collection.json`

### API Playground
Access the Swagger UI at:
- Development: http://localhost:3001/api/docs
- Production: https://api.production-tool.com/api/docs

### Health Check
```bash
curl https://api.production-tool.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "websocket": "healthy"
  }
}
```