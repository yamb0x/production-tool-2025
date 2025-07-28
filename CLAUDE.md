# CLAUDE.md - Project Rules for Production Tool 2.0 Monorepo

## Critical Rules

### 1. Monorepo Structure - ALWAYS FOLLOW
- **NEVER** create files outside the monorepo structure
- **ALWAYS** check the project structure guide before creating any file
- **FOLLOW** the monorepo hierarchy:
  - `apps/web/` - Frontend Next.js application
  - `apps/api/` - Backend NestJS application
  - `packages/` - Shared packages (types, ui, utils)
  - `docs/` - ALL documentation
- **USE** proper app/package for each file type
- **RESPECT** package boundaries - no circular dependencies

### 1. Backups - ALWAYS FOLLOW

- **STRATEGY**: Multi-layer backup with version history, PITR, daily snapshots, and tenant exports
- **VERSION HISTORY**: Every change is tracked in `data_version_history` table
- **RECOVERY**: Instant rollback to any version, point-in-time recovery, or full restore
- **TESTING**: Regular recovery tests to ensure backup integrity
- **DOCUMENTATION**: See `docs/architecture/backup-strategy.md` for full details

### 2. File Creation Workflow
1. **CHECK** current location with `pwd`
2. **REVIEW** `docs/guides/project-structure.md` for correct placement
3. **CREATE** necessary directories if they don't exist
4. **PLACE** file in the appropriate subdirectory
5. **VERIFY** placement with `ls -la <path>`

### 3. Documentation Structure - UPDATED 2025-01-27
- **CONSOLIDATED**: 22 files reduced to 8 essential guides
- **LOCATION**: All documentation in `docs/` directory
- **ESSENTIAL GUIDES**: 
  - `docs/architecture-guide.md` - Complete technical architecture
  - `docs/development-workflow.md` - AI-assisted development practices
  - `docs/setup-guide.md` - Development environment setup
  - `docs/monorepo-guide.md` - Project structure and organization
  - `docs/security-guide.md` - Security implementation
  - `docs/tools-stack.md` - Complete technology reference
  - `docs/technical-decisions.md` - All architectural decisions
  - `docs/implementation-roadmap.md` - Development timeline
- **SPECIALIZED AGENTS**: `.claude/agents/` - Domain-specific AI agents

### 4. Project Context
- **Project**: Production Tool 2.0 - Artist booking and project management platform
- **Architecture**: Separated frontend/backend with monorepo structure
- **Frontend**: Next.js 15 (Vercel) - SSR/SSG only
- **Backend**: NestJS (Railway/DigitalOcean) - REST API + WebSockets
- **Database**: PostgreSQL with GIST constraints (Neon)
- **Real-time**: Socket.IO with Redis adapter
- **Team**: 2-person team using AI-assisted development

### 5. Development Standards
- **USE** TypeScript strict mode
- **FOLLOW** patterns in `docs/architecture-guide.md`
- **IMPLEMENT** comprehensive error handling
- **MAINTAIN** clear module boundaries
- **LEVERAGE** specialized AI agents in `.claude/agents/` for domain-specific tasks:
  - `booking-specialist.md` - GIST constraints and booking workflows
  - `realtime-coordinator.md` - Socket.IO and real-time features
  - `api-architect.md` - RESTful API design and documentation
  - `database-engineer.md` - PostgreSQL optimization and migrations
  - `security-architect.md` - Multi-tenant security and RLS policies
  - `test-engineer.md` - Comprehensive testing strategies
  - `ui-specialist.md` - React components and design systems

## File Placement Quick Reference

| File Type | Location |
|-----------|----------|
| React Components | `apps/web/components/[feature]/` |
| Frontend Pages | `apps/web/app/[route]/` |
| API Controllers | `apps/api/src/modules/[module]/` |
| NestJS Services | `apps/api/src/modules/[module]/` |
| Shared Types | `packages/shared-types/src/` |
| Shared UI | `packages/ui/src/components/` |
| Frontend Tests | `apps/web/__tests__/` |
| Backend Tests | `apps/api/test/` |
| Documentation | `docs/[category]/` |
| Scripts | `scripts/[purpose]/` |

## Essential Documents - UPDATED STRUCTURE
- `docs/setup-guide.md` - **READ FIRST** - Development environment setup
- `docs/monorepo-guide.md` - Project structure and organization
- `docs/architecture-guide.md` - Complete technical architecture (replaces old architecture.md)
- `docs/security-guide.md` - Zero-trust security and tenant isolation
- `docs/development-workflow.md` - AI-assisted development practices  
- `docs/technical-decisions.md` - All TDRs and architectural choices (TDR-011 is current)
- `docs/tools-stack.md` - Complete technology and tools reference
- `docs/implementation-roadmap.md` - Development timeline and milestones

## Commands to run after changes
```bash
# Run from root directory
pnpm lint        # Lint all packages
pnpm type-check  # TypeScript check
pnpm test        # Run all tests

# Or for specific apps:
pnpm lint:web
pnpm lint:api
```

---
*Last updated: 2025-01-27*
*Architecture updated to separated frontend/backend with monorepo structure*