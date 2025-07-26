import { pgTable, uuid, varchar, timestamp, integer, decimal, text, boolean, index, pgEnum, json, jsonb, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Enums
export const tenantTypeEnum = pgEnum('tenant_type', ['studio', 'freelancer', 'enterprise']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'member', 'freelancer']);
export const artistTypeEnum = pgEnum('artist_type', ['3d_artist', 'animator', 'compositor', 'lighter', 'rigger', 'modeler', 'fx_artist', 'freelancer']);
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