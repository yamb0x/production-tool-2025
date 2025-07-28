import { z } from 'zod';

// Environment validation schema
const environmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_API_URL: z.string().url('Invalid API URL'),
  NEXT_PUBLIC_WS_URL: z.string().url('Invalid WebSocket URL'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(20),
  DATABASE_SSL_MODE: z.enum(['require', 'prefer', 'disable']).default('prefer'),
  
  // Authentication
  CLERK_SECRET_KEY: z.string().startsWith('sk_', 'Clerk secret key must start with sk_'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Clerk publishable key must start with pk_'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Redis
  REDIS_URL: z.string().url('Invalid Redis URL'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),
  
  // External Services
  EMAIL_PROVIDER: z.enum(['sendgrid', 'resend', 'ses']).default('sendgrid'),
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  FROM_EMAIL: z.string().email('Invalid from email').optional(),
  
  // Storage
  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'cloudinary', 'local']).default('local'),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Cloudflare R2
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  
  // Analytics
  POSTHOG_KEY: z.string().startsWith('phc_').optional(),
  POSTHOG_HOST: z.string().url().optional(),
  
  // Development
  ENABLE_SWAGGER: z.coerce.boolean().default(false),
  ENABLE_PLAYGROUND: z.coerce.boolean().default(false),
  ENABLE_DEBUG_LOGS: z.coerce.boolean().default(false),
  DRIZZLE_STUDIO_PORT: z.coerce.number().min(1024).max(65535).default(4983),
  
  // Feature Flags
  FEATURE_ADVANCED_ANALYTICS: z.coerce.boolean().default(false),
  FEATURE_INTEGRATIONS: z.coerce.boolean().default(false),
  FEATURE_MOBILE_APP: z.coerce.boolean().default(false),
  FEATURE_WEBHOOKS: z.coerce.boolean().default(true),
  
  // Security
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  TRUSTED_PROXIES: z.string().default('127.0.0.1,::1'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_MAX_AGE: z.coerce.number().default(86400000),
});

// Custom validation for conditional requirements
const conditionalSchema = environmentSchema.superRefine((data, ctx) => {
  // Storage provider specific validations
  if (data.STORAGE_PROVIDER === 's3') {
    if (!data.AWS_ACCESS_KEY_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AWS_ACCESS_KEY_ID is required when using S3 storage',
        path: ['AWS_ACCESS_KEY_ID'],
      });
    }
    if (!data.AWS_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AWS_SECRET_ACCESS_KEY is required when using S3 storage',
        path: ['AWS_SECRET_ACCESS_KEY'],
      });
    }
    if (!data.AWS_S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AWS_S3_BUCKET is required when using S3 storage',
        path: ['AWS_S3_BUCKET'],
      });
    }
  }
  
  if (data.STORAGE_PROVIDER === 'r2') {
    if (!data.CLOUDFLARE_R2_ACCESS_KEY_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLOUDFLARE_R2_ACCESS_KEY_ID is required when using R2 storage',
        path: ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
      });
    }
    if (!data.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLOUDFLARE_R2_SECRET_ACCESS_KEY is required when using R2 storage',
        path: ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
      });
    }
    if (!data.CLOUDFLARE_R2_BUCKET_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLOUDFLARE_R2_BUCKET_NAME is required when using R2 storage',
        path: ['CLOUDFLARE_R2_BUCKET_NAME'],
      });
    }
  }
  
  // Email provider specific validations
  if (data.EMAIL_PROVIDER === 'sendgrid' && !data.SENDGRID_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SENDGRID_API_KEY is required when using SendGrid',
      path: ['SENDGRID_API_KEY'],
    });
  }
  
  // Production specific validations
  if (data.NODE_ENV === 'production') {
    if (!data.SENTRY_DSN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SENTRY_DSN is recommended for production',
        path: ['SENTRY_DSN'],
      });
    }
    
    if (data.ENABLE_SWAGGER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Swagger should be disabled in production',
        path: ['ENABLE_SWAGGER'],
      });
    }
    
    if (data.ENABLE_PLAYGROUND) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GraphQL Playground should be disabled in production',
        path: ['ENABLE_PLAYGROUND'],
      });
    }
  }
});

export type Environment = z.infer<typeof conditionalSchema>;

// Validate and export environment
export function validateEnvironment(): Environment {
  try {
    const env = conditionalSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(error.issues.map(issue => `  ${issue.path.join('.')}: ${issue.message}`).join('\n'));
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnvironment();

// Utility function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof Pick<Environment, 
  'FEATURE_ADVANCED_ANALYTICS' | 
  'FEATURE_INTEGRATIONS' | 
  'FEATURE_MOBILE_APP' | 
  'FEATURE_WEBHOOKS'
>): boolean {
  return env[feature];
}

// Utility function to get database configuration
export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
    sslMode: env.DATABASE_SSL_MODE,
  };
}

// Utility function to get Redis configuration
export function getRedisConfig() {
  return {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };
}

// Utility function to get storage configuration
export function getStorageConfig() {
  const base = {
    provider: env.STORAGE_PROVIDER,
  };
  
  switch (env.STORAGE_PROVIDER) {
    case 's3':
      return {
        ...base,
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        region: env.AWS_REGION!,
        bucket: env.AWS_S3_BUCKET!,
      };
    case 'r2':
      return {
        ...base,
        accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        bucket: env.CLOUDFLARE_R2_BUCKET_NAME!,
        endpoint: env.CLOUDFLARE_R2_ENDPOINT!,
      };
    default:
      return base;
  }
}

// Development helper to print environment status
export function printEnvironmentStatus() {
  if (env.NODE_ENV !== 'development') return;
  
  console.log('🔧 Environment Configuration:');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Log Level: ${env.LOG_LEVEL}`);
  console.log(`  Database: ${env.DATABASE_URL.split('@')[1] || 'local'}`);
  console.log(`  Redis: ${env.REDIS_URL.split('@')[1] || 'local'}`);
  console.log(`  Storage: ${env.STORAGE_PROVIDER}`);
  console.log(`  Email: ${env.EMAIL_PROVIDER}`);
  console.log(`  Features: ${Object.entries(env)
    .filter(([key]) => key.startsWith('FEATURE_'))
    .filter(([, value]) => value)
    .map(([key]) => key.replace('FEATURE_', '').toLowerCase())
    .join(', ') || 'none'}`);
}