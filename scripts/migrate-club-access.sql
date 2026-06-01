-- Run in Neon SQL Editor (or: psql $DATABASE_URL -f scripts/migrate-club-access.sql)
-- if `npm run db:push` stops at the booking_invites unique prompt.
-- Task K: club entry QR tables.

DO $$ BEGIN
  CREATE TYPE access_pass_role AS ENUM ('host', 'guest', 'coach');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS club_access_settings (
  id varchar(32) PRIMARY KEY DEFAULT 'default' NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  grace_minutes_before integer DEFAULT 60 NOT NULL,
  grace_minutes_after integer DEFAULT 60 NOT NULL,
  max_participants_per_booking integer DEFAULT 6 NOT NULL,
  reset_allowed_roles jsonb DEFAULT '["staff","super_admin"]'::jsonb NOT NULL,
  require_reset_reason boolean DEFAULT true NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

INSERT INTO club_access_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS booking_access_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role access_pass_role NOT NULL,
  token varchar(64) NOT NULL UNIQUE,
  status varchar(20) DEFAULT 'active' NOT NULL,
  presence varchar(20) DEFAULT 'outside' NOT NULL,
  revoked_at timestamp,
  revoke_reason text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT booking_access_passes_booking_user_unique UNIQUE (booking_id, user_id)
);

CREATE TABLE IF NOT EXISTS access_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  pass_id uuid REFERENCES booking_access_passes(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  scanned_at timestamp DEFAULT now() NOT NULL,
  result varchar(40) NOT NULL,
  presence_before varchar(20),
  presence_after varchar(20),
  actor_type varchar(20) NOT NULL,
  actor_user_id uuid REFERENCES users(id),
  forced_direction varchar(10),
  reset_performed boolean DEFAULT false NOT NULL,
  reason text,
  message text
);
