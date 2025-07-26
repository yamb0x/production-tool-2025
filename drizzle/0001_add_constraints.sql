-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Add GIST exclusion constraint to prevent double bookings
-- This ensures no overlapping bookings for the same artist
ALTER TABLE bookings 
ADD CONSTRAINT no_double_booking 
EXCLUDE USING gist (
  artist_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status IN ('confirmed', 'pencil'));

-- Add constraint to prevent overlapping holds for the same artist
ALTER TABLE bookings 
ADD CONSTRAINT no_overlapping_holds 
EXCLUDE USING gist (
  artist_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status = 'hold' AND hold_type = 'hard');

-- Function to automatically expire holds
CREATE OR REPLACE FUNCTION expire_holds() RETURNS void AS $$
BEGIN
  UPDATE bookings 
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE status = 'hold' 
    AND hold_expires_at IS NOT NULL 
    AND hold_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to track booking events
CREATE OR REPLACE FUNCTION track_booking_event() RETURNS TRIGGER AS $$
DECLARE
  event_type_value event_type;
  event_data jsonb;
  next_version integer;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type_value := 'booking_created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'cancelled' THEN
        event_type_value := 'booking_cancelled';
      ELSIF NEW.status = 'completed' THEN
        event_type_value := 'booking_completed';
      ELSE
        event_type_value := 'booking_updated';
      END IF;
    ELSE
      event_type_value := 'booking_updated';
    END IF;
  END IF;

  -- Build event data
  event_data := jsonb_build_object(
    'old', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    'new', row_to_json(NEW),
    'changes', CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        (SELECT jsonb_object_agg(key, value) 
         FROM jsonb_each(row_to_json(NEW)::jsonb) 
         WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb)->key)
      ELSE NULL 
    END
  );

  -- Get next version number
  SELECT COALESCE(MAX(event_version), 0) + 1 
  INTO next_version
  FROM booking_events 
  WHERE aggregate_id = NEW.id;

  -- Insert event
  INSERT INTO booking_events (
    aggregate_id,
    tenant_id,
    event_type,
    event_data,
    event_version,
    user_id,
    occurred_at
  ) VALUES (
    NEW.id,
    NEW.tenant_id,
    event_type_value,
    event_data,
    next_version,
    NEW.updated_by,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking events
DROP TRIGGER IF EXISTS booking_event_trigger ON bookings;
CREATE TRIGGER booking_event_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION track_booking_event();

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    tenant_id,
    user_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    occurred_at
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to main tables
CREATE TRIGGER audit_artists AFTER INSERT OR UPDATE OR DELETE ON artists
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_project_phases AFTER INSERT OR UPDATE OR DELETE ON project_phases
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Row Level Security (RLS) policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation
CREATE POLICY tenant_isolation_bookings ON bookings
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_artists ON artists
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_projects ON projects
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_booking_events ON booking_events
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_artist_status_time 
ON bookings (artist_id, status, start_time DESC) 
WHERE status IN ('confirmed', 'hold');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_events_aggregate_time 
ON booking_events (aggregate_id, occurred_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_skills_gin 
ON artists USING gin (skills);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_metadata_gin 
ON projects USING gin (metadata);

-- Materialized view for artist utilization
CREATE MATERIALIZED VIEW IF NOT EXISTS artist_utilization AS
SELECT 
  a.id as artist_id,
  a.tenant_id,
  a.name as artist_name,
  DATE_TRUNC('week', b.start_time) as week_start,
  COUNT(DISTINCT b.id) as booking_count,
  SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600) as booked_hours,
  COUNT(DISTINCT b.project_id) as project_count
FROM artists a
LEFT JOIN bookings b ON a.id = b.artist_id 
  AND b.status IN ('confirmed', 'completed')
  AND b.start_time >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY a.id, a.tenant_id, a.name, DATE_TRUNC('week', b.start_time);

CREATE INDEX idx_artist_utilization_lookup 
ON artist_utilization (artist_id, week_start DESC);

-- Function to refresh utilization view
CREATE OR REPLACE FUNCTION refresh_artist_utilization() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_utilization;
END;
$$ LANGUAGE plpgsql;