# CLAUDE.md - Project Rules for Production Tool 2.0 Monorepo

## 🎯 Workflow Overview

### Before Starting Work - MANDATORY CHECKLIST
**⚠️ CRITICAL**: EVERY task must follow this workflow. NO EXCEPTIONS.

1. **Create Task Management FIRST**: Use TodoWrite tool immediately upon receiving any task
   - Break down work into specific, trackable tasks
   - Mark first task as "in_progress" before starting
   - Example: Update documentation, fix bugs, implement features, etc.

2. **Plan First**: Write a detailed plan to `.claude/tasks/TASK_NAME.md`
   - Include implementation approach and reasoning
   - Break down into manageable tasks  
   - Focus on MVP - don't over-engineer

3. **Get Approval**: Ask for review before proceeding with implementation

**🚨 VIOLATION ALERT**: If you start work without creating tasks via TodoWrite tool, you are violating the established workflow protocol.

### During Implementation
- **Update Task Status**: Mark tasks as "in_progress" when starting, "completed" when finished
- **Update Progress**: Keep the plan updated as you work  
- **Document Changes**: Append detailed descriptions of completed work for handover
- **Single Focus**: Only ONE task should be "in_progress" at any time

### After Completion  
- **Mark Tasks Complete**: Use TodoWrite tool to mark all tasks as "completed"
- **Update Context**: Ensure session context file is current for next engineer

## 📝 Task Management System

### TodoWrite Tool Usage - MANDATORY
Every Claude session MUST use the TodoWrite tool for task tracking:

```javascript
// Example: Create tasks immediately when receiving work
TodoWrite([
  {"id": "1", "content": "Fix TypeScript errors in seed file", "status": "in_progress"},
  {"id": "2", "content": "Update CLAUDE.md documentation", "status": "pending"},
  {"id": "3", "content": "Test development server setup", "status": "pending"}
])

// Update status as work progresses  
TodoWrite([
  {"id": "1", "content": "Fix TypeScript errors in seed file", "status": "completed"},
  {"id": "2", "content": "Update CLAUDE.md documentation", "status": "in_progress"},
  {"id": "3", "content": "Test development server setup", "status": "pending"}
])
```

### Task Status Definitions
- **pending**: Task defined but not yet started
- **in_progress**: Currently active task (ONLY ONE at a time)
- **completed**: Task finished and verified

## 📋 Session Context Management

### Before ANY Work
**MANDATORY**: Check `.claude/tasks/context_session_[id].md` for full context
- If file doesn't exist, create it
- Contains: session history, overall plan, agent interactions
- Sub-agents continuously add their context

### After Work Completion
**MANDATORY**: Update `.claude/tasks/context_session_[id].md` with:
- What was accomplished
- Key decisions made
- Outstanding items
- Next steps

## 🤖 Specialized Sub-Agents

You have access to five specialized agents for enhanced development:

### 1. `vercel-ai-sdk-v5-expert` 
**Domain**: Vercel AI SDK v5 Implementation
- **When to use**: ALL Vercel AI SDK related tasks
- **Expertise**: Streaming, model providers, error handling, edge functions
- **Reference**: `.claude/agents/vercel-ai-sdk-v5-expert.md`
- **Tags**: `[ai, vercel-ai-sdk, streaming, model-providers, typescript]`

### 2. `shadcn-ui-builder`
**Domain**: UI Component Development
- **When to use**: ALL UI building and styling tasks
- **Expertise**: shadcn/ui components, accessibility, responsive design, Tailwind CSS
- **Reference**: `.claude/agents/shadcn-ui-builder.md`
- **Tags**: `[ui, frontend, shadcn-ui, accessibility, responsive-design, tailwind]`

### 3. `database-architect`
**Domain**: Database Architecture & Design
- **When to use**: Database design decisions, data modeling, scalability planning
- **Expertise**: MongoDB/PostgreSQL, CQRS, event sourcing, microservices data patterns
- **Reference**: `.claude/agents/database-architect.md`
- **Tags**: `[database, architecture, data-modeling, scalability, mongodb]`
- **Note**: Use PROACTIVELY for database design decisions

### 4. `prompt-engineer`
**Domain**: AI Prompt Optimization
- **When to use**: Building AI features, optimizing agent performance, crafting system prompts
- **Expertise**: LLM optimization, prompt patterns, chain-of-thought, few-shot learning
- **Reference**: `.claude/agents/prompt-engineer.md`
- **Tags**: `[prompts, llm, optimization, ai-features]`
- **Note**: Use PROACTIVELY when implementing AI features

### 5. `blind-validator`
**Domain**: Independent Testing & Validation
- **When to use**: Testing EVERY completed task
- **Approach**: Tests without implementation context for unbiased validation
- **Process**: Iterates until all tests pass
- **Reference**: `.claude/agents/blind-validator.md`
- **Tags**: `[testing, validation, quality-assurance, blind-testing]`

### Agent Interaction Protocol
1. **Research Phase**: Sub-agents provide implementation guidance
2. **Implementation**: You execute based on agent recommendations
3. **Validation**: Blind validator confirms functionality
4. **Context Sharing**: Pass `context_session_[id].md` to agents

### Agent Usage Examples
```bash
# For AI streaming implementation
→ Consult vercel-ai-sdk-v5-expert for best practices
→ Implement the solution
→ Have blind-validator test the endpoint

# For creating a new component
→ Consult shadcn-ui-builder for component architecture
→ Build the component
→ Have blind-validator test accessibility and responsiveness

# For database design
→ Consult database-architect PROACTIVELY for schema design
→ Implement data models and migrations
→ Validate data integrity with blind-validator

# For AI feature development
→ Consult prompt-engineer for optimal prompt crafting
→ Implement AI feature with vercel-ai-sdk-v5-expert guidance
→ Test AI responses with blind-validator

# For any completed feature
→ Prepare test requirements
→ Send to blind-validator WITHOUT implementation details
→ Iterate based on validation feedback until PASS
```

### Agent Team Summary
| Agent | Primary Use | Proactive? |
|-------|------------|------------|
| `vercel-ai-sdk-v5-expert` | AI SDK implementation | When using AI features |
| `shadcn-ui-builder` | UI components & styling | When building UI |
| `database-architect` | Database design & modeling | ✅ YES - Always consult first |
| `prompt-engineer` | AI prompt optimization | ✅ YES - For all AI features |
| `blind-validator` | Testing & validation | After EVERY implementation |

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


### 2. File Creation Workflow
1. **CHECK** current location with `pwd`
2. **REVIEW** `docs/guides/project-structure.md` for correct placement
3. **CREATE** necessary directories if they don't exist
4. **PLACE** file in the appropriate subdirectory
5. **VERIFY** placement with `ls -la <path>`

- **SPECIALIZED AGENTS**: `.claude/agents/` - Domain-specific AI agents

### 4. Project Context
- **Project**: Production Tool 2.0 - Artist booking and project management platform
- **Architecture**: Separated frontend/backend with monorepo structure
- **Frontend**: Next.js 15 (Vercel) - SSR/SSG only
- **Backend**: NestJS (Railway/DigitalOcean) - REST API + WebSockets
- **Database**: MongoDB with application-level conflict detection (Atlas/Local)
- **Real-time**: Socket.IO with Redis adapter
- **Team**: 2-person team using AI-assisted development

### 5. Development Standards
- **USE** TypeScript strict mode
- **FOLLOW** patterns in `docs/architecture-guide.md`
- **IMPLEMENT** comprehensive error handling
- **MAINTAIN** clear module boundaries
- **LEVERAGE** all 5 specialized AI agents for domain expertise
- **CONSULT** database-architect and prompt-engineer PROACTIVELY
- **VALIDATE** all implementations with blind-validator

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

## 🔧 Development Environment & Monitoring

### Development Server Commands
```bash
# Main development commands
pnpm dev                 # Start all services in parallel (recommended)
pnpm dev:web            # Start only Next.js frontend (port 3000)
pnpm dev:api            # Start only NestJS backend (port 8000)
pnpm dev:monitor        # Enhanced development monitor with colored output

# Utility commands  
pnpm dev:setup          # Install dependencies and copy environment file
pnpm dev:clean          # Clean build artifacts and caches
```

### Background Development Monitoring for Claude
**CRITICAL**: When setting up development environment for efficient AI-assisted coding:

1. **Start Background Monitoring**: Always run `pnpm dev` with background flag in Bash tool
   ```bash
   # Example - Run this in background for real-time monitoring
   cd "/path/to/project" && pnpm dev
   # Use: run_in_background: true in Bash tool
   ```

2. **Monitor Console Output**: Use BashOutput tool to check compilation errors and server status
   - TypeScript errors are automatically detected and displayed
   - Server startup status and port information shown
   - Real-time compilation feedback for all packages

3. **Error Detection Workflow**:
   - Background process captures console output continuously  
   - Claude can identify TypeScript/build errors immediately
   - Enables rapid iteration and debugging without manual server restarts

### Development Server Status Indicators
- ✅ **Web**: `http://localhost:3000` (Next.js frontend)
- ✅ **API**: `http://localhost:8000` (NestJS backend) 
- ⚡ **Real-time**: Turbo monitors all packages with hot reload
- 🔍 **Monitoring**: Background bash process for error detection

**Note**: Development servers run in parallel. Monitor BashOutput for compilation status and errors.

---
*Last updated: 2025-08-23*
*Added development monitoring system and enhanced task management workflow enforcement*