# Production Tool 2025 - API Documentation

## Overview

The Production Tool 2025 API is a RESTful API built with Next.js API routes, providing endpoints for managing bookings, resources, projects, and users in a multi-tenant environment.

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API endpoints require authentication via Clerk. Include the session token in requests:

```bash
Authorization: Bearer <clerk_session_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": {}, // Response data
  "meta": {   // Optional metadata
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}, // Optional error details
  "requestId": "req_123456789"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., booking overlap) |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Endpoints

### Authentication

#### Get Current User
```http
GET /api/v1/auth/me
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "studio_manager",
    "tenantId": "uuid",
    "tenant": {
      "id": "uuid",
      "name": "Studio Name",
      "type": "studio"
    }
  }
}
```

### Bookings

#### List Bookings
```http
GET /api/v1/bookings
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | ISO date string (filter start) |
| `endDate` | string | ISO date string (filter end) |
| `resourceId` | string | UUID of resource |
| `projectId` | string | UUID of project |
| `status` | string | Booking status filter |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

**Example:**
```bash
GET /api/v1/bookings?startDate=2025-01-01&endDate=2025-01-31&resourceId=uuid
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "resourceId": "uuid",
      "projectId": "uuid",
      "userId": "uuid",
      "startTime": "2025-01-15T09:00:00.000Z",
      "endTime": "2025-01-15T17:00:00.000Z",
      "status": "confirmed",
      "title": "Project Photoshoot",
      "notes": "Equipment setup required",
      "version": 1,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z",
      "resource": {
        "id": "uuid",
        "name": "Studio A",
        "type": "space"
      },
      "project": {
        "id": "uuid",
        "name": "Client Project"
      },
      "user": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

#### Create Booking
```http
POST /api/v1/bookings
```

**Request Body:**
```json
{
  "resourceId": "uuid",
  "projectId": "uuid", // optional
  "startTime": "2025-01-15T09:00:00.000Z",
  "endTime": "2025-01-15T17:00:00.000Z",
  "title": "Project Photoshoot",
  "notes": "Equipment setup required" // optional
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "resourceId": "uuid",
    "projectId": "uuid",
    "userId": "uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "status": "pending",
    "title": "Project Photoshoot",
    "notes": "Equipment setup required",
    "version": 1,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

#### Get Booking
```http
GET /api/v1/bookings/[id]
```

**Response:** Same as create booking response.

#### Update Booking
```http
PATCH /api/v1/bookings/[id]
```

**Request Body:**
```json
{
  "startTime": "2025-01-15T10:00:00.000Z",
  "endTime": "2025-01-15T18:00:00.000Z",
  "status": "confirmed",
  "notes": "Updated requirements",
  "version": 1 // Required for optimistic locking
}
```

**Response:** Updated booking object.

#### Delete Booking
```http
DELETE /api/v1/bookings/[id]
```

**Response:** 204 No Content

#### Check Availability
```http
POST /api/v1/bookings/check-availability
```

**Request Body:**
```json
{
  "resourceId": "uuid",
  "startTime": "2025-01-15T09:00:00.000Z",
  "endTime": "2025-01-15T17:00:00.000Z"
}
```

**Response:**
```json
{
  "data": {
    "available": true,
    "conflicts": [] // Array of conflicting bookings if any
  }
}
```

### Resources

#### List Resources
```http
GET /api/v1/resources
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Resource type filter |
| `isActive` | boolean | Active status filter |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Studio A",
      "type": "space",
      "description": "Main photography studio",
      "capacity": 1,
      "hourlyRate": "150.00",
      "isActive": true,
      "metadata": {
        "size": "40x30 feet",
        "equipment": ["lights", "backdrop"]
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

#### Create Resource
```http
POST /api/v1/resources
```

**Request Body:**
```json
{
  "name": "Studio B",
  "type": "space",
  "description": "Secondary studio space",
  "capacity": 1,
  "hourlyRate": "120.00",
  "metadata": {
    "size": "30x20 feet"
  }
}
```

#### Get Resource
```http
GET /api/v1/resources/[id]
```

#### Update Resource
```http
PATCH /api/v1/resources/[id]
```

#### Delete Resource
```http
DELETE /api/v1/resources/[id]
```

#### Get Resource Availability
```http
GET /api/v1/resources/[id]/availability
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | ISO date string |
| `endDate` | string | ISO date string |

**Response:**
```json
{
  "data": {
    "resourceId": "uuid",
    "availability": [
      {
        "date": "2025-01-15",
        "slots": [
          {
            "startTime": "09:00",
            "endTime": "12:00",
            "available": true
          },
          {
            "startTime": "12:00",
            "endTime": "17:00",
            "available": false,
            "booking": {
              "id": "uuid",
              "title": "Existing Booking"
            }
          }
        ]
      }
    ]
  }
}
```

### Projects

#### List Projects
```http
GET /api/v1/projects
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Project status filter |
| `clientName` | string | Client name filter |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Product Photography Campaign",
      "description": "Q1 2025 product shoot",
      "status": "active",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-03-31T00:00:00.000Z",
      "budget": "50000.00",
      "clientName": "Acme Corp",
      "metadata": {
        "deliverables": ["photos", "videos"],
        "priority": "high"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

#### Create Project
```http
POST /api/v1/projects
```

**Request Body:**
```json
{
  "name": "New Campaign",
  "description": "Description here",
  "status": "planning",
  "startDate": "2025-02-01T00:00:00.000Z",
  "endDate": "2025-04-30T00:00:00.000Z",
  "budget": "25000.00",
  "clientName": "Client Name",
  "metadata": {
    "priority": "medium"
  }
}
```

#### Get Project
```http
GET /api/v1/projects/[id]
```

#### Update Project
```http
PATCH /api/v1/projects/[id]
```

#### Delete Project
```http
DELETE /api/v1/projects/[id]
```

#### Get Project Bookings
```http
GET /api/v1/projects/[id]/bookings
```

Returns all bookings associated with the project.

### Users

#### List Team Members
```http
GET /api/v1/users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | User role filter |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "studio_manager",
      "avatar": "https://...",
      "settings": {
        "timezone": "UTC",
        "notifications": true
      },
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

#### Update User
```http
PATCH /api/v1/users/[id]
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "studio_manager",
  "settings": {
    "timezone": "America/New_York",
    "notifications": false
  }
}
```

### Availability

#### Set Resource Availability
```http
POST /api/v1/availability
```

**Request Body:**
```json
{
  "resourceId": "uuid",
  "schedules": [
    {
      "dayOfWeek": 1, // Monday
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

#### Get Resource Availability Rules
```http
GET /api/v1/availability?resourceId=uuid
```

## Real-Time Events

The API supports real-time updates via WebSocket connections. Connect to the Socket.IO endpoint:

```javascript
const socket = io('/api/socket', {
  auth: {
    token: 'clerk_session_token'
  }
});

// Listen for booking events
socket.on('booking:created', (booking) => {
  console.log('New booking:', booking);
});

socket.on('booking:updated', (booking) => {
  console.log('Updated booking:', booking);
});

socket.on('booking:deleted', (bookingId) => {
  console.log('Deleted booking:', bookingId);
});

// Subscribe to resource updates
socket.emit('booking:subscribe', 'resource-uuid');
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Global limit**: 1000 requests per 15 minutes per user
- **Booking endpoints**: 10 requests per minute per user
- **Authentication endpoints**: 5 requests per minute per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `BOOKING_CONFLICT` | Booking time conflicts with existing booking |
| `RESOURCE_NOT_AVAILABLE` | Resource not available for booking |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `TENANT_ISOLATION_ERROR` | Cross-tenant access attempted |
| `OPTIMISTIC_LOCK_ERROR` | Resource was modified by another user |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Pagination metadata is returned in the `meta` field:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

### Filtering
```
GET /api/v1/bookings?status=confirmed&startDate=2025-01-01
```

### Sorting
```
GET /api/v1/bookings?sort=startTime&order=desc
```

Common sort fields:
- `createdAt` (default)
- `updatedAt`
- `startTime` (bookings)
- `name` (resources, projects)

## SDK Examples

### JavaScript/TypeScript
```typescript
import { ApiClient } from '@/lib/api/client';

const api = new ApiClient();

// Create booking
const booking = await api.createBooking({
  resourceId: 'uuid',
  startTime: '2025-01-15T09:00:00.000Z',
  endTime: '2025-01-15T17:00:00.000Z',
  title: 'Project Meeting'
});

// Get bookings with filters
const bookings = await api.getBookings({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  resourceId: 'uuid'
});
```

### cURL Examples

```bash
# Create booking
curl -X POST https://api.example.com/api/v1/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "title": "Project Meeting"
  }'

# Get bookings
curl -X GET "https://api.example.com/api/v1/bookings?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer <token>"
```

## Webhooks

The API supports webhooks for external integrations:

### Webhook Events
- `booking.created`
- `booking.updated`
- `booking.deleted`
- `project.created`
- `project.updated`

### Webhook Payload
```json
{
  "event": "booking.created",
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "booking": { /* booking object */ }
  },
  "timestamp": "2025-01-01T10:00:00.000Z",
  "signature": "webhook_signature"
}
```

### Webhook Configuration
Configure webhooks in your tenant settings or via API:

```http
POST /api/v1/webhooks
```

```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["booking.created", "booking.updated"],
  "secret": "webhook_secret"
}
```

This API documentation provides a comprehensive reference for integrating with the Production Tool 2025 platform.