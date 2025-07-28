import { pgTable, uuid, varchar, timestamp, integer, decimal, text, boolean, index, pgEnum, json, jsonb, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Enums
export const tenantTypeEnum = pgEnum('tenant_type', ['studio', 'freelancer', 'enterprise']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'member', 'freelancer']);
export const artistTypeEnum = pgEnum('artist_type', ['3d_artist', 'animator', 'compositor', 'lighter', 'rigger', 'modeler', 'fx_artist', 'freelancer']);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'filled', 'cancelled']);
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'freelance', 'internship']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'reviewing', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn']);
export const bookingStatusEnum = pgEnum('booking_status', ['hold', 'pencil', 'confirmed', 'cancelled', 'completed']);
export const projectStatusEnum = pgEnum('project_status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']);
export const holdTypeEnum = pgEnum('hold_type', ['soft', 'hard', 'first_refusal']);
export const eventTypeEnum = pgEnum('event_type', [
  'booking_created',
  'booking_updated', 
  'booking_cancelled',
  'booking_completed',
  'hold_created',
  'hold_converted',
  'hold_expired',
  'project_created',
  'project_updated',
  'artist_availability_changed'
]);

// Core Tables
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: tenantTypeEnum('type').notNull(),
  settings: jsonb('settings').$type<{
    timezone?: string;
    workingHours?: { start: string; end: string };
    bookingRules?: Record<string, any>;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  role: userRoleEnum('role').notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  avatar: varchar('avatar', { length: 500 }),
  settings: jsonb('settings').$type<{
    notifications?: Record<string, boolean>;
    preferences?: Record<string, any>;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('users_tenant_idx').on(table.tenantId),
  clerkIdx: index('users_clerk_idx').on(table.clerkId),
}));

export const artists = pgTable('artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  type: artistTypeEnum('type').notNull(),
  skills: jsonb('skills').$type<string[]>(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  isFreelancer: boolean('is_freelancer').default(false),
  metadata: jsonb('metadata').$type<{
    portfolio?: string;
    experience?: number;
    software?: string[];
    certifications?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('artists_tenant_idx').on(table.tenantId),
  typeIdx: index('artists_type_idx').on(table.type),
  userIdx: index('artists_user_idx').on(table.userId),
  activeIdx: index('artists_active_idx').on(table.isActive, table.tenantId),
}));

// Artist Profiles table - enhanced artist information
export const artistProfiles = pgTable('artist_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id').references(() => artists.id).notNull().unique(),
  bio: text('bio'),
  headline: varchar('headline', { length: 255 }),
  location: varchar('location', { length: 255 }),
  timezone: varchar('timezone', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),
  socialLinks: jsonb('social_links').$type<{
    linkedin?: string;
    artstation?: string;
    behance?: string;
    instagram?: string;
    vimeo?: string;
    github?: string;
  }>(),
  portfolio: jsonb('portfolio').$type<Array<{
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    projectType?: string;
    tools?: string[];
    date?: string;
    link?: string;
  }>>(),
  experience: jsonb('experience').$type<Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    projects?: string[];
  }>>(),
  education: jsonb('education').$type<Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }>>(),
  certifications: jsonb('certifications').$type<Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }>>(),
  languages: jsonb('languages').$type<Array<{
    language: string;
    proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
  }>>(),
  availability: jsonb('availability').$type<{
    status: 'available' | 'busy' | 'on_project' | 'not_available';
    nextAvailable?: string;
    preferredSchedule?: string;
    remoteWork: boolean;
    willingToTravel: boolean;
    preferredLocations?: string[];
  }>(),
  preferences: jsonb('preferences').$type<{
    projectTypes?: string[];
    minimumDuration?: number;
    preferredRateType?: 'hourly' | 'daily' | 'project';
    industries?: string[];
    teamSize?: 'solo' | 'small' | 'medium' | 'large';
  }>(),
  stats: jsonb('stats').$type<{
    completedProjects?: number;
    totalHoursBooked?: number;
    averageRating?: number;
    repeatClients?: number;
    onTimeDelivery?: number;
  }>(),
  visibility: varchar('visibility', { length: 20 }).default('private').$type<'public' | 'studio_only' | 'private'>(),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  artistIdx: uniqueIndex('artist_profiles_artist_idx').on(table.artistId),
  visibilityIdx: index('artist_profiles_visibility_idx').on(table.visibility),
  locationIdx: index('artist_profiles_location_idx').on(table.location),
  verifiedIdx: index('artist_profiles_verified_idx').on(table.isVerified),
}));

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  description: text('description'),
  status: projectStatusEnum('status').default('planning'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  clientName: varchar('client_name', { length: 255 }),
  metadata: jsonb('metadata').$type<{
    phases?: Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      dependencies?: string[];
    }>;
    milestones?: Array<{
      id: string;
      name: string;
      date: string;
      completed: boolean;
    }>;
    color?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('projects_tenant_idx').on(table.tenantId),
  statusIdx: index('projects_status_idx').on(table.status),
  dateIdx: index('projects_date_idx').on(table.startDate, table.endDate),
}));

// Enhanced bookings table with GIST constraint support
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  artistId: uuid('artist_id').references(() => artists.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').default('hold'),
  holdType: holdTypeEnum('hold_type'),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  title: varchar('title', { length: 255 }),
  notes: text('notes'),
  rate: decimal('rate', { precision: 10, scale: 2 }),
  rateType: varchar('rate_type', { length: 20 }).$type<'hourly' | 'daily' | 'fixed'>(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  version: integer('version').default(1).notNull(), // For optimistic locking
  metadata: jsonb('metadata').$type<{
    color?: string;
    tags?: string[];
    priority?: number;
    recurrence?: {
      pattern: string;
      until?: string;
    };
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  tenantTimeIdx: index('bookings_tenant_time_idx').on(table.tenantId, table.startTime, table.endTime),
  artistTimeIdx: index('bookings_artist_time_idx').on(table.artistId, table.startTime),
  projectIdx: index('bookings_project_idx').on(table.projectId),
  statusIdx: index('bookings_status_idx').on(table.status),
  holdExpiryIdx: index('bookings_hold_expiry_idx').on(table.holdExpiresAt).where(sql`hold_expires_at IS NOT NULL`),
  // Note: GIST exclusion constraint will be added via raw SQL migration
}));

// Event sourcing table
export const bookingEvents = pgTable('booking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  aggregateId: uuid('aggregate_id').notNull(), // booking id
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  eventData: jsonb('event_data').notNull(),
  eventVersion: integer('event_version').notNull(),
  userId: uuid('user_id').references(() => users.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  aggregateIdx: index('booking_events_aggregate_idx').on(table.aggregateId, table.eventVersion),
  tenantTimeIdx: index('booking_events_tenant_time_idx').on(table.tenantId, table.occurredAt),
  eventTypeIdx: index('booking_events_type_idx').on(table.eventType),
  uniqueVersion: uniqueIndex('booking_events_unique_version').on(table.aggregateId, table.eventVersion),
}));

// Availability patterns
export const availabilityPatterns = pgTable('availability_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id').references(() => artists.id).notNull(),
  name: varchar('name', { length: 255 }),
  pattern: jsonb('pattern').notNull().$type<{
    type: 'weekly' | 'custom';
    weekly?: Array<{
      dayOfWeek: number; // 0-6
      startTime: string; // HH:MM
      endTime: string;   // HH:MM
    }>;
    custom?: Array<{
      date: string;
      available: boolean;
      startTime?: string;
      endTime?: string;
    }>;
  }>(),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  priority: integer('priority').default(0), // Higher priority patterns override lower ones
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  artistIdx: index('availability_patterns_artist_idx').on(table.artistId),
  validityIdx: index('availability_patterns_validity_idx').on(table.validFrom, table.validUntil),
}));

// Project phases for Gantt chart
export const projectPhases = pgTable('project_phases', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  progress: integer('progress').default(0), // 0-100
  color: varchar('color', { length: 7 }), // Hex color
  parentId: uuid('parent_id'), // For nested phases
  orderIndex: integer('order_index').default(0),
  dependencies: jsonb('dependencies').$type<string[]>(), // Array of phase IDs
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('project_phases_project_idx').on(table.projectId),
  parentIdx: index('project_phases_parent_idx').on(table.parentId),
  dateIdx: index('project_phases_date_idx').on(table.startDate, table.endDate),
}));

// Cache invalidation tracking
export const cacheInvalidation = pgTable('cache_invalidation', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: varchar('cache_key', { length: 255 }).notNull(),
  invalidatedAt: timestamp('invalidated_at').defaultNow().notNull(),
  reason: varchar('reason', { length: 255 }),
  metadata: jsonb('metadata'),
}, (table) => ({
  keyIdx: index('cache_invalidation_key_idx').on(table.cacheKey),
  timeIdx: index('cache_invalidation_time_idx').on(table.invalidatedAt),
}));

// Audit log for all changes
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  operation: varchar('operation', { length: 20 }).notNull(), // INSERT, UPDATE, DELETE
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
}, (table) => ({
  tenantTimeIdx: index('audit_log_tenant_time_idx').on(table.tenantId, table.occurredAt),
  recordIdx: index('audit_log_record_idx').on(table.tableName, table.recordId),
  userIdx: index('audit_log_user_idx').on(table.userId),
}));

// Job Listings table
export const jobListings = pgTable('job_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  responsibilities: text('responsibilities'),
  type: jobTypeEnum('type').notNull(),
  artistType: artistTypeEnum('artist_type').notNull(),
  status: jobStatusEnum('status').default('draft').notNull(),
  location: varchar('location', { length: 255 }),
  isRemote: boolean('is_remote').default(false),
  rateMin: decimal('rate_min', { precision: 10, scale: 2 }),
  rateMax: decimal('rate_max', { precision: 10, scale: 2 }),
  rateType: varchar('rate_type', { length: 20 }).$type<'hourly' | 'daily' | 'project' | 'annual'>(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  startDate: timestamp('start_date'),
  duration: varchar('duration', { length: 100 }),
  applicationDeadline: timestamp('application_deadline'),
  skills: jsonb('skills').$type<string[]>(),
  benefits: jsonb('benefits').$type<string[]>(),
  metadata: jsonb('metadata').$type<{
    experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'director';
    teamSize?: string;
    reportingTo?: string;
    department?: string;
    tags?: string[];
    keywords?: string[];
  }>(),
  contactEmail: varchar('contact_email', { length: 255 }),
  externalUrl: varchar('external_url', { length: 500 }),
  viewCount: integer('view_count').default(0),
  applicationCount: integer('application_count').default(0),
  publishedAt: timestamp('published_at'),
  closedAt: timestamp('closed_at'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('job_listings_tenant_idx').on(table.tenantId),
  statusIdx: index('job_listings_status_idx').on(table.status),
  typeIdx: index('job_listings_type_idx').on(table.artistType),
  publishedIdx: index('job_listings_published_idx').on(table.publishedAt, table.status),
  projectIdx: index('job_listings_project_idx').on(table.projectId),
}));

// Job Applications table
export const jobApplications = pgTable('job_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobListingId: uuid('job_listing_id').references(() => jobListings.id).notNull(),
  artistId: uuid('artist_id').references(() => artists.id).notNull(),
  status: applicationStatusEnum('status').default('pending').notNull(),
  coverLetter: text('cover_letter'),
  resumeUrl: varchar('resume_url', { length: 500 }),
  portfolioUrl: varchar('portfolio_url', { length: 500 }),
  availableFrom: timestamp('available_from'),
  expectedRate: decimal('expected_rate', { precision: 10, scale: 2 }),
  notes: text('notes'),
  metadata: jsonb('metadata').$type<{
    source?: string;
    referral?: string;
    questionnaire?: Record<string, any>;
    attachments?: Array<{ name: string; url: string; type: string }>;
  }>(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  interviewScheduledAt: timestamp('interview_scheduled_at'),
  offerDetails: jsonb('offer_details').$type<{
    rate?: number;
    rateType?: string;
    startDate?: string;
    duration?: string;
    terms?: string;
  }>(),
  rejectionReason: text('rejection_reason'),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  jobIdx: index('job_applications_job_idx').on(table.jobListingId),
  artistIdx: index('job_applications_artist_idx').on(table.artistId),
  statusIdx: index('job_applications_status_idx').on(table.status),
  uniqueApplication: uniqueIndex('job_applications_unique').on(table.jobListingId, table.artistId),
}));

// Saved Jobs table - artists can save jobs for later
export const savedJobs = pgTable('saved_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id').references(() => artists.id).notNull(),
  jobListingId: uuid('job_listing_id').references(() => jobListings.id).notNull(),
  notes: text('notes'),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSaved: primaryKey({ columns: [table.artistId, table.jobListingId] }),
  artistIdx: index('saved_jobs_artist_idx').on(table.artistId),
}));

// Notification queue
export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(), // email, push, in-app
  status: varchar('status', { length: 20 }).default('pending'), // pending, sent, failed
  payload: jsonb('payload').notNull(),
  scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  attempts: integer('attempts').default(0),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('notification_queue_status_idx').on(table.status, table.scheduledFor),
  userIdx: index('notification_queue_user_idx').on(table.userId),
}));

// Data Backup and Version History table
export const dataVersionHistory = pgTable('data_version_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  version: integer('version').notNull(),
  operation: varchar('operation', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  data: jsonb('data').notNull(), // Complete record snapshot
  delta: jsonb('delta'), // What changed from previous version
  userId: uuid('user_id').references(() => users.id),
  reason: text('reason'), // Why the change was made
  metadata: jsonb('metadata').$type<{
    ipAddress?: string;
    userAgent?: string;
    source?: string;
    tags?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  recordVersionIdx: uniqueIndex('data_version_history_record_version').on(table.tableName, table.recordId, table.version),
  tenantTimeIdx: index('data_version_history_tenant_time_idx').on(table.tenantId, table.createdAt),
  tableRecordIdx: index('data_version_history_table_record_idx').on(table.tableName, table.recordId),
}));

// Backup Snapshots table - periodic full backups
export const backupSnapshots = pgTable('backup_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  snapshotType: varchar('snapshot_type', { length: 20 }).notNull(), // 'full', 'incremental', 'tenant'
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  storageLocation: varchar('storage_location', { length: 500 }),
  sizeBytes: integer('size_bytes'),
  recordCount: jsonb('record_count').$type<Record<string, number>>(), // Count per table
  checksum: varchar('checksum', { length: 64 }),
  metadata: jsonb('metadata').$type<{
    compression?: string;
    encryption?: boolean;
    tables?: string[];
    error?: string;
  }>(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  tenantIdx: index('backup_snapshots_tenant_idx').on(table.tenantId),
  statusIdx: index('backup_snapshots_status_idx').on(table.status),
  typeIdx: index('backup_snapshots_type_idx').on(table.snapshotType),
  expiryIdx: index('backup_snapshots_expiry_idx').on(table.expiresAt),
}));

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertArtistSchema = createInsertSchema(artists);
export const selectArtistSchema = createSelectSchema(artists);
export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);
export const insertBookingEventSchema = createInsertSchema(bookingEvents);
export const selectBookingEventSchema = createSelectSchema(bookingEvents);
export const insertAvailabilityPatternSchema = createInsertSchema(availabilityPatterns);
export const selectAvailabilityPatternSchema = createSelectSchema(availabilityPatterns);
export const insertProjectPhaseSchema = createInsertSchema(projectPhases);
export const selectProjectPhaseSchema = createSelectSchema(projectPhases);
export const insertArtistProfileSchema = createInsertSchema(artistProfiles);
export const selectArtistProfileSchema = createSelectSchema(artistProfiles);
export const insertJobListingSchema = createInsertSchema(jobListings);
export const selectJobListingSchema = createSelectSchema(jobListings);
export const insertJobApplicationSchema = createInsertSchema(jobApplications);
export const selectJobApplicationSchema = createSelectSchema(jobApplications);
export const insertSavedJobSchema = createInsertSchema(savedJobs);
export const selectSavedJobSchema = createSelectSchema(savedJobs);
export const insertDataVersionHistorySchema = createInsertSchema(dataVersionHistory);
export const selectDataVersionHistorySchema = createSelectSchema(dataVersionHistory);
export const insertBackupSnapshotSchema = createInsertSchema(backupSnapshots);
export const selectBackupSnapshotSchema = createSelectSchema(backupSnapshots);

// Types
export type Tenant = z.infer<typeof selectTenantSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type Artist = z.infer<typeof selectArtistSchema>;
export type Project = z.infer<typeof selectProjectSchema>;
export type Booking = z.infer<typeof selectBookingSchema>;
export type BookingEvent = z.infer<typeof selectBookingEventSchema>;
export type AvailabilityPattern = z.infer<typeof selectAvailabilityPatternSchema>;
export type ProjectPhase = z.infer<typeof selectProjectPhaseSchema>;

// Create types
export type CreateTenant = z.infer<typeof insertTenantSchema>;
export type CreateUser = z.infer<typeof insertUserSchema>;
export type CreateArtist = z.infer<typeof insertArtistSchema>;
export type CreateProject = z.infer<typeof insertProjectSchema>;
export type CreateBooking = z.infer<typeof insertBookingSchema>;
export type CreateBookingEvent = z.infer<typeof insertBookingEventSchema>;
export type CreateAvailabilityPattern = z.infer<typeof insertAvailabilityPatternSchema>;
export type CreateProjectPhase = z.infer<typeof insertProjectPhaseSchema>;
export type ArtistProfile = z.infer<typeof selectArtistProfileSchema>;
export type CreateArtistProfile = z.infer<typeof insertArtistProfileSchema>;
export type JobListing = z.infer<typeof selectJobListingSchema>;
export type CreateJobListing = z.infer<typeof insertJobListingSchema>;
export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type CreateJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type SavedJob = z.infer<typeof selectSavedJobSchema>;
export type CreateSavedJob = z.infer<typeof insertSavedJobSchema>;
export type DataVersionHistory = z.infer<typeof selectDataVersionHistorySchema>;
export type CreateDataVersionHistory = z.infer<typeof insertDataVersionHistorySchema>;
export type BackupSnapshot = z.infer<typeof selectBackupSnapshotSchema>;
export type CreateBackupSnapshot = z.infer<typeof insertBackupSnapshotSchema>;