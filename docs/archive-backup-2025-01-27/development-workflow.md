# Development Workflow Guide

This guide covers the day-to-day development workflow for Production Tool 2.0, including Git practices, code standards, testing procedures, and collaboration guidelines.

## Git Workflow

### Branch Strategy

We follow a simplified Git Flow:

```
main (production)
  └── develop (staging)
        ├── feature/booking-system
        ├── feature/artist-profiles
        ├── fix/double-booking-issue
        └── chore/update-dependencies
```

### Branch Naming Conventions

- `feature/[description]` - New features
- `fix/[description]` - Bug fixes
- `chore/[description]` - Maintenance tasks
- `refactor/[description]` - Code refactoring
- `docs/[description]` - Documentation updates

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```bash
feat(booking): add conflict detection for bookings
fix(auth): resolve tenant isolation issue
docs(api): update endpoint documentation
chore(deps): upgrade to Next.js 15
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   ```bash
   # Make your changes
   pnpm lint
   pnpm test
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub
   ```

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No console.logs left
   ```

## Development Standards

### Code Style

#### TypeScript
```typescript
// ✅ Good
export interface BookingCreateDto {
  artistId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  notes?: string;
}

// ❌ Bad
export interface booking_create_dto {
  artist_id: any;
  start_time: string;
  end_time: string;
  Title: string;
  Notes: string | null;
}
```

#### React Components
```typescript
// ✅ Good - Functional component with proper typing
interface BookingCardProps {
  booking: Booking;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function BookingCard({ booking, onEdit, onDelete }: BookingCardProps) {
  // Component logic
}

// ❌ Bad - Class component, any types
export class BookingCard extends React.Component<any, any> {
  // Avoid class components
}
```

#### File Organization
```typescript
// ✅ Good - Clear structure
// components/booking/BookingCard.tsx
export function BookingCard() {}

// components/booking/BookingCard.test.tsx
describe('BookingCard', () => {})

// components/booking/BookingCard.stories.tsx
export default { title: 'Booking/BookingCard' }

// ❌ Bad - Everything in one file
// components/BookingStuff.tsx
export function BookingCard() {}
export function BookingList() {}
export function BookingForm() {}
```

### API Development Standards

#### Controller Structure
```typescript
// ✅ Good
@Controller('bookings')
@UseGuards(AuthGuard, TenantGuard)
@ApiTags('Bookings')
export class BookingController {
  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    // Implementation
  }
}
```

#### Service Layer
```typescript
// ✅ Good - Clear separation of concerns
@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // Business logic
    const booking = await this.bookingRepository.create(dto);
    
    // Emit event
    this.eventEmitter.emit('booking.created', { booking, userId });
    
    return booking;
  }
}
```

### Testing Standards

#### Unit Tests
```typescript
// ✅ Good
describe('BookingService', () => {
  let service: BookingService;
  let repository: MockType<BookingRepository>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: BookingRepository,
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get(BookingService);
    repository = module.get(BookingRepository);
  });

  describe('create', () => {
    it('should create a booking', async () => {
      // Arrange
      const dto = { /* ... */ };
      const expected = { /* ... */ };
      repository.create.mockResolvedValue(expected);

      // Act
      const result = await service.create(dto, 'user-id');

      // Assert
      expect(result).toEqual(expected);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });
  });
});
```

#### Integration Tests
```typescript
// ✅ Good
describe('Booking API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/bookings (POST)', () => {
    return request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', 'Bearer token')
      .send({
        artistId: 'artist-123',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('id');
      });
  });
});
```

## Development Workflow

### Daily Workflow

1. **Start Your Day**
   ```bash
   git checkout develop
   git pull origin develop
   pnpm install  # In case dependencies changed
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Start Development**
   ```bash
   pnpm dev  # Starts all apps in dev mode
   ```

4. **Make Changes**
   - Write code
   - Write tests
   - Update documentation

5. **Pre-commit Checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: your feature"
   ```

7. **Push and Create PR**
   ```bash
   git push origin feature/your-feature
   ```

### Code Review Process

#### As a Reviewer
- Check code quality and standards
- Verify tests are included
- Ensure documentation is updated
- Look for security issues
- Test locally if needed
- Provide constructive feedback

#### As an Author
- Self-review before requesting review
- Respond to all feedback
- Update PR based on comments
- Re-request review after changes
- Merge only after approval

## Debugging Workflow

### Frontend Debugging

1. **Browser DevTools**
   - Use React Developer Tools
   - Check Network tab for API calls
   - Use Console for debugging

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug Frontend",
     "url": "http://localhost:3000",
     "webRoot": "${workspaceFolder}/apps/web"
   }
   ```

### Backend Debugging

1. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Backend",
     "runtimeArgs": ["run", "start:debug"],
     "cwd": "${workspaceFolder}/apps/api"
   }
   ```

2. **Logging**
   ```typescript
   import { Logger } from '@nestjs/common';

   export class BookingService {
     private readonly logger = new Logger(BookingService.name);

     async create(dto: CreateBookingDto) {
       this.logger.debug('Creating booking', dto);
       // Implementation
     }
   }
   ```

## Environment Management

### Local Development
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# apps/api/.env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/production_tool
CLERK_SECRET_KEY=sk_test_...
```

### Testing Environment
```bash
# Use .env.test for test-specific configs
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/production_tool_test
```

## Continuous Integration

### Pre-push Checks
```bash
#!/bin/bash
# .husky/pre-push

pnpm lint
pnpm type-check
pnpm test
```

### GitHub Actions
Every PR triggers:
1. Install dependencies
2. Run linting
3. Run type checking
4. Run tests
5. Build applications
6. Check bundle size

## Performance Monitoring

### Development Performance
1. Use React DevTools Profiler
2. Monitor bundle size with `next-bundle-analyzer`
3. Check database query performance
4. Monitor WebSocket connections

### Production Monitoring
1. Use Sentry for error tracking
2. Monitor API response times
3. Track real user metrics
4. Set up alerts for issues

## Documentation Workflow

### When to Document
- New features or APIs
- Complex business logic
- Configuration changes
- Architecture decisions

### Documentation Standards
```typescript
/**
 * Creates a new booking with conflict detection
 * 
 * @param dto - Booking creation data
 * @param userId - ID of the user creating the booking
 * @returns The created booking
 * @throws ConflictException if booking conflicts with existing
 */
async create(dto: CreateBookingDto, userId: string): Promise<Booking> {
  // Implementation
}
```

### API Documentation
- Update OpenAPI spec
- Include request/response examples
- Document error responses
- Keep Postman collection updated

## Troubleshooting

### Common Issues

1. **Type Errors**
   ```bash
   # Rebuild shared packages
   pnpm build:packages
   ```

2. **Module Not Found**
   ```bash
   # Clear cache and reinstall
   pnpm clean
   pnpm install
   ```

3. **Database Issues**
   ```bash
   # Reset database
   pnpm db:reset
   pnpm db:seed
   ```

4. **Build Failures**
   ```bash
   # Clear turbo cache
   rm -rf .turbo
   pnpm build
   ```

## Best Practices Summary

1. **Always**:
   - Write tests for new code
   - Update documentation
   - Follow code standards
   - Review your own PR first

2. **Never**:
   - Commit directly to main/develop
   - Skip tests
   - Leave console.logs
   - Ignore linting errors

3. **Remember**:
   - Small, focused PRs are better
   - Clear commit messages help
   - Ask for help when stuck
   - Document complex logic