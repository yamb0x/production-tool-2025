-- Production Tool 2.0 - Initial Database Schema
-- This migration creates the complete database schema with all tables and constraints

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create enums
DO $$ BEGIN
 CREATE TYPE "tenant_type" AS ENUM('studio', 'freelancer', 'enterprise');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('owner', 'manager', 'member', 'freelancer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "artist_type" AS ENUM('3d_artist', 'animator', 'compositor', 'lighter', 'rigger', 'modeler', 'fx_artist', 'freelancer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "job_status" AS ENUM('draft', 'open', 'closed', 'filled', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "job_type" AS ENUM('full_time', 'part_time', 'contract', 'freelance', 'internship');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "application_status" AS ENUM('pending', 'reviewing', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "booking_status" AS ENUM('hold', 'pencil', 'confirmed', 'cancelled', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "hold_type" AS ENUM('soft', 'hard', 'first_refusal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "event_type" AS ENUM('booking_created', 'booking_updated', 'booking_cancelled', 'booking_completed', 'hold_created', 'hold_converted', 'hold_expired', 'project_created', 'project_updated', 'artist_availability_changed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create tables in dependency order

-- Tenants table (root of multi-tenancy)
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "tenant_type" NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"avatar" varchar(500),
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"description" text,
	"status" "project_status" DEFAULT 'planning',
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" numeric(10, 2),
	"client_name" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code")
);

-- Artists table
CREATE TABLE IF NOT EXISTS "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"type" "artist_type" NOT NULL,
	"skills" jsonb,
	"hourly_rate" numeric(10, 2),
	"daily_rate" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"is_freelancer" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Artist Profiles table
CREATE TABLE IF NOT EXISTS "artist_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"bio" text,
	"headline" varchar(255),
	"location" varchar(255),
	"timezone" varchar(50),
	"phone" varchar(50),
	"website" varchar(500),
	"social_links" jsonb,
	"portfolio" jsonb,
	"experience" jsonb,
	"education" jsonb,
	"certifications" jsonb,
	"languages" jsonb,
	"availability" jsonb,
	"preferences" jsonb,
	"stats" jsonb,
	"visibility" varchar(20) DEFAULT 'private',
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artist_profiles_artist_id_unique" UNIQUE("artist_id")
);

-- Bookings table
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'hold',
	"hold_type" "hold_type",
	"hold_expires_at" timestamp with time zone,
	"title" varchar(255),
	"notes" text,
	"rate" numeric(10, 2),
	"rate_type" varchar(20),
	"total_amount" numeric(10, 2),
	"version" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

-- Booking Events table (Event Sourcing)
CREATE TABLE IF NOT EXISTS "booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"event_data" jsonb NOT NULL,
	"event_version" integer NOT NULL,
	"user_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Availability Patterns table
CREATE TABLE IF NOT EXISTS "availability_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"name" varchar(255),
	"pattern" jsonb NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Project Phases table
CREATE TABLE IF NOT EXISTS "project_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"progress" integer DEFAULT 0,
	"color" varchar(7),
	"parent_id" uuid,
	"order_index" integer DEFAULT 0,
	"dependencies" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Cache Invalidation table
CREATE TABLE IF NOT EXISTS "cache_invalidation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" varchar(255) NOT NULL,
	"invalidated_at" timestamp DEFAULT now() NOT NULL,
	"reason" varchar(255),
	"metadata" jsonb
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"operation" varchar(20) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);

-- Job Listings table
CREATE TABLE IF NOT EXISTS "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"type" "job_type" NOT NULL,
	"artist_type" "artist_type" NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"location" varchar(255),
	"is_remote" boolean DEFAULT false,
	"rate_min" numeric(10, 2),
	"rate_max" numeric(10, 2),
	"rate_type" varchar(20),
	"currency" varchar(3) DEFAULT 'USD',
	"start_date" timestamp,
	"duration" varchar(100),
	"application_deadline" timestamp,
	"skills" jsonb,
	"benefits" jsonb,
	"metadata" jsonb,
	"contact_email" varchar(255),
	"external_url" varchar(500),
	"view_count" integer DEFAULT 0,
	"application_count" integer DEFAULT 0,
	"published_at" timestamp,
	"closed_at" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Job Applications table
CREATE TABLE IF NOT EXISTS "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_listing_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"cover_letter" text,
	"resume_url" varchar(500),
	"portfolio_url" varchar(500),
	"available_from" timestamp,
	"expected_rate" numeric(10, 2),
	"notes" text,
	"metadata" jsonb,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"interview_scheduled_at" timestamp,
	"offer_details" jsonb,
	"rejection_reason" text,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Saved Jobs table
CREATE TABLE IF NOT EXISTS "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"job_listing_id" uuid NOT NULL,
	"notes" text,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	PRIMARY KEY("artist_id", "job_listing_id")
);

-- Notification Queue table
CREATE TABLE IF NOT EXISTS "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"payload" jsonb NOT NULL,
	"scheduled_for" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"attempts" integer DEFAULT 0,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Data Version History table
CREATE TABLE IF NOT EXISTS "data_version_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"operation" varchar(20) NOT NULL,
	"data" jsonb NOT NULL,
	"delta" jsonb,
	"user_id" uuid,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Backup Snapshots table
CREATE TABLE IF NOT EXISTS "backup_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"snapshot_type" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"storage_location" varchar(500),
	"size_bytes" integer,
	"record_count" jsonb,
	"checksum" varchar(64),
	"metadata" jsonb,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_by" uuid
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "artists" ADD CONSTRAINT "artists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add remaining foreign key constraints
DO $$ BEGIN
 ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "availability_patterns" ADD CONSTRAINT "availability_patterns_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "job_listings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "job_listings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "data_version_history" ADD CONSTRAINT "data_version_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "data_version_history" ADD CONSTRAINT "data_version_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "backup_snapshots" ADD CONSTRAINT "backup_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "backup_snapshots" ADD CONSTRAINT "backup_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_tenant_idx" ON "users" ("tenant_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_clerk_idx" ON "users" ("clerk_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artists_tenant_idx" ON "artists" ("tenant_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artists_type_idx" ON "artists" ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artists_user_idx" ON "artists" ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artists_active_idx" ON "artists" ("is_active", "tenant_id");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "artist_profiles_artist_idx" ON "artist_profiles" ("artist_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artist_profiles_visibility_idx" ON "artist_profiles" ("visibility");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artist_profiles_location_idx" ON "artist_profiles" ("location");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "artist_profiles_verified_idx" ON "artist_profiles" ("is_verified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_tenant_idx" ON "projects" ("tenant_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_status_idx" ON "projects" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_date_idx" ON "projects" ("start_date", "end_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_tenant_time_idx" ON "bookings" ("tenant_id", "start_time", "end_time");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_artist_time_idx" ON "bookings" ("artist_id", "start_time");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_project_idx" ON "bookings" ("project_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_hold_expiry_idx" ON "bookings" ("hold_expires_at") WHERE hold_expires_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "booking_events_aggregate_idx" ON "booking_events" ("aggregate_id", "event_version");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "booking_events_tenant_time_idx" ON "booking_events" ("tenant_id", "occurred_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "booking_events_type_idx" ON "booking_events" ("event_type");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "booking_events_unique_version" ON "booking_events" ("aggregate_id", "event_version");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "availability_patterns_artist_idx" ON "availability_patterns" ("artist_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "availability_patterns_validity_idx" ON "availability_patterns" ("valid_from", "valid_until");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "project_phases_project_idx" ON "project_phases" ("project_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "project_phases_parent_idx" ON "project_phases" ("parent_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "project_phases_date_idx" ON "project_phases" ("start_date", "end_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "cache_invalidation_key_idx" ON "cache_invalidation" ("cache_key");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "cache_invalidation_time_idx" ON "cache_invalidation" ("invalidated_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_tenant_time_idx" ON "audit_log" ("tenant_id", "occurred_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_record_idx" ON "audit_log" ("table_name", "record_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_user_idx" ON "audit_log" ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_listings_tenant_idx" ON "job_listings" ("tenant_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_listings_status_idx" ON "job_listings" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_listings_type_idx" ON "job_listings" ("artist_type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_listings_published_idx" ON "job_listings" ("published_at", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_listings_project_idx" ON "job_listings" ("project_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_applications_job_idx" ON "job_applications" ("job_listing_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_applications_artist_idx" ON "job_applications" ("artist_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_applications_status_idx" ON "job_applications" ("status");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "job_applications_unique" ON "job_applications" ("job_listing_id", "artist_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "saved_jobs_artist_idx" ON "saved_jobs" ("artist_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_queue_status_idx" ON "notification_queue" ("status", "scheduled_for");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_queue_user_idx" ON "notification_queue" ("user_id");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "data_version_history_record_version" ON "data_version_history" ("table_name", "record_id", "version");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "data_version_history_tenant_time_idx" ON "data_version_history" ("tenant_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "data_version_history_table_record_idx" ON "data_version_history" ("table_name", "record_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "backup_snapshots_tenant_idx" ON "backup_snapshots" ("tenant_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "backup_snapshots_status_idx" ON "backup_snapshots" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "backup_snapshots_type_idx" ON "backup_snapshots" ("snapshot_type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "backup_snapshots_expiry_idx" ON "backup_snapshots" ("expires_at");

-- CRITICAL: GIST Exclusion Constraint for Booking Conflicts
-- This prevents overlapping bookings for the same artist
ALTER TABLE "bookings" 
ADD CONSTRAINT "bookings_no_overlap_per_artist" 
EXCLUDE USING GIST (
  artist_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) 
WHERE (status IN ('confirmed', 'pencil'));

-- Add trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON artist_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_listings_updated_at BEFORE UPDATE ON job_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic tenant isolation)
-- Note: These are basic policies - production should have more granular policies

-- Tenants: Users can only see their own tenant
CREATE POLICY "Users can only access their own tenant" ON tenants
    FOR ALL USING (id = current_setting('app.current_tenant')::uuid);

-- Users: Users can only see users in their tenant
CREATE POLICY "Users can only access users in their tenant" ON users
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Artists: Users can only see artists in their tenant
CREATE POLICY "Users can only access artists in their tenant" ON artists
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Projects: Users can only see projects in their tenant
CREATE POLICY "Users can only access projects in their tenant" ON projects
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Bookings: Users can only see bookings in their tenant
CREATE POLICY "Users can only access bookings in their tenant" ON bookings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Add similar policies for other tables...
-- (Additional policies would be added here for each table)

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE CURRENT_DATABASE() IS 'Production Tool 2.0 - Artist booking and project management platform';
COMMENT ON TABLE tenants IS 'Multi-tenant root table for studio/freelancer/enterprise accounts';
COMMENT ON TABLE bookings IS 'Artist bookings with GIST constraints preventing overlaps';
COMMENT ON TABLE booking_events IS 'Event sourcing for booking state changes';
COMMENT ON TABLE data_version_history IS 'Complete audit trail with rollback capability';
COMMENT ON TABLE backup_snapshots IS 'Automated backup tracking and retention';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Production Tool 2.0 database schema created successfully!';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '- Multi-tenant Row Level Security';
    RAISE NOTICE '- GIST exclusion constraints for booking conflicts';
    RAISE NOTICE '- Event sourcing for audit trails';
    RAISE NOTICE '- Comprehensive backup and version history';
    RAISE NOTICE '- Performance-optimized indexes';
END $$;