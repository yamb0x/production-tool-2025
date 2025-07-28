# Sub-Agents Workflow Guide

## Overview

This document describes the sub-agents system implemented for Production Tool 2.0, providing specialized AI assistants for different aspects of the artist booking and project management platform development.

## Sub-Agents Architecture

### Design Philosophy

The sub-agents system follows the principle of **specialized expertise** where each agent has:
- **Deep domain knowledge** in a specific area
- **Focused tool access** for relevant operations
- **Context-aware activation** based on task requirements
- **Consistent quality standards** within their domain

### Auto-Activation System

Sub-agents are automatically invoked based on:
1. **Keyword detection** in user requests
2. **File path analysis** when working with specific code areas
3. **Task complexity** requiring specialized knowledge
4. **Explicit user requests** mentioning agent capabilities

## Available Sub-Agents

### 1. Booking Specialist (`booking-specialist`)

**Purpose**: Manages booking system logic, GIST constraints, and conflict prevention

**Auto-Activation Triggers**:
- Keywords: "booking", "schedule", "conflict", "availability", "GIST", "constraint"
- File paths: `*/booking/*`, `*/calendar/*`, `*/schedule/*`
- Database operations on booking-related tables

**Specialized Knowledge**:
- Hold/Pencil/Confirmed booking workflows
- PostgreSQL GIST exclusion constraints
- Real-time availability updates
- Booking conflict resolution

**Example Usage**:
```
"Implement the booking conflict detection logic with GIST constraints"
"Fix the hold expiration mechanism for bookings"
"Create the booking calendar component with real-time updates"
```

### 2. Security Architect (`security-architect`)

**Purpose**: Enforces multi-tenant security, RLS policies, and data isolation

**Auto-Activation Triggers**:
- Keywords: "security", "tenant", "isolation", "RLS", "auth", "permission"
- File paths: `*/auth/*`, `*/security/*`, `*/guards/*`, `*/policies/*`
- Authentication or authorization related tasks

**Specialized Knowledge**:
- Row-Level Security (RLS) implementation
- Multi-tenant data isolation
- JWT authentication and authorization
- Security vulnerability prevention

**Example Usage**:
```
"Implement tenant isolation for the new artists table"
"Review the authentication flow for security vulnerabilities"
"Create RLS policies for the booking system"
```

### 3. Real-time Coordinator (`realtime-coordinator`)

**Purpose**: Manages Socket.IO features, WebSocket connections, and live collaboration

**Auto-Activation Triggers**:
- Keywords: "realtime", "socket", "websocket", "live", "collaboration", "events"
- File paths: `*/websocket/*`, `*/socket/*`, `*/realtime/*`, `*/events/*`
- Real-time feature implementation

**Specialized Knowledge**:
- Socket.IO server and client configuration
- Event-driven real-time updates
- Multi-user conflict resolution
- WebSocket connection management

**Example Usage**:
```
"Add real-time booking updates via Socket.IO"
"Implement presence awareness for project collaboration"
"Fix WebSocket connection issues in production"
```

### 4. API Architect (`api-architect`)

**Purpose**: Designs RESTful APIs, NestJS architecture, and backend services

**Auto-Activation Triggers**:
- Keywords: "API", "endpoint", "controller", "service", "NestJS", "REST"
- File paths: `*/api/*`, `*/controllers/*`, `*/services/*`, `*/modules/*`
- Backend API development tasks

**Specialized Knowledge**:
- NestJS module architecture
- RESTful API design patterns
- Validation schemas with Zod
- OpenAPI documentation

**Example Usage**:
```
"Create the artist management API endpoints"
"Design the project management service architecture"
"Implement validation for the booking creation API"
```

### 5. UI Specialist (`ui-specialist`)

**Purpose**: Creates React components, implements design systems, and builds responsive UIs

**Auto-Activation Triggers**:
- Keywords: "component", "UI", "frontend", "React", "design", "responsive"
- File paths: `*/components/*`, `*/ui/*`, `*/pages/*`, `*/app/*`
- Frontend development tasks

**Specialized Knowledge**:
- React component development
- Shadcn/ui design system
- Zustand state management
- Responsive design with Tailwind CSS

**Example Usage**:
```
"Create the booking calendar component with drag-and-drop"
"Implement the artist profile management UI"
"Build a responsive project dashboard"
```

### 6. Database Engineer (`database-engineer`)

**Purpose**: Manages PostgreSQL schema, Drizzle ORM, and database optimization

**Auto-Activation Triggers**:
- Keywords: "database", "schema", "migration", "SQL", "Drizzle", "PostgreSQL"
- File paths: `*/schema/*`, `*/migrations/*`, `*/db/*`, `*/database/*`
- Database-related operations

**Specialized Knowledge**:
- PostgreSQL schema design
- Drizzle ORM implementation
- Database performance optimization
- Migration management

**Example Usage**:
```
"Create the database schema for job listings"
"Optimize the booking queries for better performance"
"Implement the data version history system"
```

### 7. Test Engineer (`test-engineer`)

**Purpose**: Implements comprehensive testing strategies and quality assurance

**Auto-Activation Triggers**:
- Keywords: "test", "testing", "spec", "e2e", "unit", "integration", "quality"
- File paths: `*/test/*`, `*/tests/*`, `*/__tests__/*`, `*.test.*`, `*.spec.*`
- Testing and quality assurance tasks

**Specialized Knowledge**:
- Jest unit testing
- Playwright E2E testing
- Integration testing patterns
- Test automation and CI/CD

**Example Usage**:
```
"Write comprehensive tests for the booking service"
"Create E2E tests for the booking workflow"
"Implement performance testing for the API"
```

## Usage Patterns

### Explicit Invocation

You can explicitly request a specific sub-agent:

```
"Use booking-specialist to implement the hold expiration logic"
"Ask security-architect to review the tenant isolation"
"Have test-engineer create E2E tests for the booking flow"
```

### Implicit Activation

Sub-agents activate automatically based on context:

```
"Fix the booking conflict detection" → booking-specialist activates
"Add authentication to the API" → security-architect activates
"Create the calendar component" → ui-specialist activates
```

### Multi-Agent Collaboration

Some tasks may involve multiple agents working together:

```
"Implement real-time booking updates with proper security"
→ Activates: realtime-coordinator + security-architect + booking-specialist
```

## Integration with Project Structure

### Monorepo Awareness

All sub-agents understand the monorepo structure:

```
production-tool/
├── apps/
│   ├── web/          # UI Specialist domain
│   └── api/          # API Architect & Database Engineer domain
├── packages/
│   ├── shared-types/ # API Architect domain
│   └── ui/          # UI Specialist domain
└── .claude/
    └── agents/      # Sub-agent configurations
```

### File Path Routing

Sub-agents automatically activate based on file paths:

- Working in `apps/web/components/booking/` → UI Specialist + Booking Specialist
- Modifying `apps/api/src/modules/auth/` → Security Architect + API Architect
- Creating `**/test/**` files → Test Engineer

## Quality Standards

### Code Quality Enforcement

Each sub-agent enforces specific quality standards:

**Booking Specialist**:
- Data integrity through database constraints
- Business rule validation
- Performance optimization for booking queries

**Security Architect**:
- Tenant isolation in all operations
- Input validation and sanitization
- Authentication and authorization checks

**UI Specialist**:
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design patterns
- Performance optimization (Core Web Vitals)

**Test Engineer**:
- 80% code coverage minimum
- Comprehensive test pyramid
- Performance testing requirements

### Cross-Agent Validation

Sub-agents validate each other's work:

- Security Architect reviews all database schemas
- Test Engineer validates all new features
- API Architect ensures consistent API patterns
- UI Specialist verifies accessibility compliance

## Development Workflow

### 1. Task Analysis

When you describe a task, the system:
1. Analyzes keywords and context
2. Determines required expertise
3. Activates appropriate sub-agents
4. Coordinates multi-agent collaboration

### 2. Implementation Process

```
User Request → Agent Selection → Implementation → Quality Gates → Delivery
```

### 3. Quality Gates

Each implementation passes through:
- Domain-specific validation (by specialized agent)
- Security review (by security-architect)
- Testing requirements (by test-engineer)
- Integration validation (by api-architect or ui-specialist)

## Best Practices

### For Users

1. **Be Specific**: Mention the domain or component you're working with
2. **Use Keywords**: Include relevant technical terms to trigger correct agents
3. **Provide Context**: Mention file paths or specific features
4. **Request Reviews**: Ask for security or quality reviews when needed

### For Development

1. **Follow Agent Expertise**: Let each agent handle their domain
2. **Respect Boundaries**: Don't ask UI Specialist for database schema design
3. **Use Multi-Agent**: Complex features benefit from multiple agents
4. **Quality First**: Always include testing and security considerations

## Troubleshooting

### Agent Not Activating

If the expected agent doesn't activate:
1. Use explicit invocation: "Use [agent-name] to..."
2. Include relevant keywords in your request
3. Mention specific file paths or components
4. Check the agent's activation triggers in their configuration

### Quality Issues

If code quality doesn't meet standards:
1. Request specific agent review: "Have security-architect review this"
2. Ask for comprehensive testing: "Use test-engineer to add full test coverage"
3. Request multi-agent collaboration: "Implement with security and testing"

### Performance Issues

If agents seem slow or inefficient:
1. Be more specific in requests to reduce context switching
2. Use explicit agent selection for clear tasks
3. Break complex tasks into domain-specific subtasks

## Future Enhancements

### Planned Improvements

1. **Performance Agent**: Specialized in optimization and monitoring
2. **DevOps Agent**: For deployment and infrastructure management
3. **Documentation Agent**: For technical writing and API docs
4. **Analytics Agent**: For data analysis and business intelligence

### Integration Roadmap

1. **IDE Integration**: Direct agent access from VS Code
2. **CI/CD Integration**: Automatic agent reviews in pull requests
3. **Monitoring Integration**: Agents that respond to production issues
4. **User Feedback**: Learning from agent effectiveness metrics

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintained By**: Production Tool 2.0 Development Team