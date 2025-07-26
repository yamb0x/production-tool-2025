# CLAUDE.md - Project Rules for Production Tool 2.0 Development

## Critical Rules

### 1. Project Structure - ALWAYS FOLLOW
- **NEVER** create files in the root directory except for config files
- **ALWAYS** check the project structure guide before creating any file
- **FOLLOW** the established folder hierarchy:
  - `docs/` - ALL documentation
  - `src/` - ALL source code
  - `tests/` - ALL test files
- **USE** proper subdirectories for each file type

### 1. Backups - ALWAYS FOLLOW

///CLEM///: 
- I think we added this while running through it together on our call, but lets just check something hasn't been deleted here!^^

### 2. File Creation Workflow
1. **CHECK** current location with `pwd`
2. **REVIEW** `docs/guides/project-structure.md` for correct placement
3. **CREATE** necessary directories if they don't exist
4. **PLACE** file in the appropriate subdirectory
5. **VERIFY** placement with `ls -la <path>`

### 3. Architecture Documentation
- **LOCATION**: All architecture docs go in `docs/architecture/`
  - Plans → `docs/architecture/plans/`
  - Decisions → `docs/architecture/decisions/`
  - Diagrams → `docs/architecture/diagrams/`
- **REVIEW** existing docs before making changes
- **MAINTAIN** consistency with established patterns

### 4. Project Context
- **Project**: Production Tool 2.0 - Artist booking and project management platform
- **Stack**: TypeScript, Next.js 15, PostgreSQL, Socket.IO
- **Architecture**: Modular monolith with event-driven patterns
- **Team**: 2-person team using AI-assisted development

### 5. Development Standards
- **USE** TypeScript strict mode
- **FOLLOW** patterns in `docs/architecture/plans/architecture-plan-04-enhanced.md`
- **IMPLEMENT** comprehensive error handling
- **MAINTAIN** clear module boundaries

## File Placement Quick Reference

| File Type | Location |
|-----------|----------|
| React Components | `src/components/[feature]/` |
| API Routes | `src/app/api/` |
| Business Logic | `src/modules/[module]/domain/` |
| Database Code | `src/modules/[module]/repository/` |
| Unit Tests | `tests/unit/[matching-src-path]/` |
| Documentation | `docs/[category]/` |
| Scripts | `scripts/[purpose]/` |

## Key Documents
- `docs/guides/project-structure.md` - **READ FIRST**
- `docs/architecture/plans/architecture-plan-04-enhanced.md` - Main architecture
- `docs/operations/platform-operations-guide.md` - How the system works
- `docs/architecture/decisions/technical-decisions-record.md` - Why decisions were made

## Commands to run after changes
```bash
npm run lint
npm run typecheck
npm test
```

---
*Last updated: 2025-01-20*