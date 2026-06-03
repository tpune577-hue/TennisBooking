-- Patch booking_access_passes when the table predates presence / revoke / updated_at columns.
-- CREATE TABLE IF NOT EXISTS (migrate-club-access.sql) does not alter existing tables.
-- Run on every Neon env (preview + production): Neon SQL Editor or npm run db:migrate-access-patch

DO $$ BEGIN
  CREATE TYPE access_pass_role AS ENUM ('host', 'guest', 'coach');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE booking_access_passes
  ADD COLUMN IF NOT EXISTS presence varchar(20) DEFAULT 'outside' NOT NULL;

ALTER TABLE booking_access_passes
  ADD COLUMN IF NOT EXISTS revoked_at timestamp;

ALTER TABLE booking_access_passes
  ADD COLUMN IF NOT EXISTS revoke_reason text;

ALTER TABLE booking_access_passes
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;

-- Backfill if columns existed as nullable without defaults
UPDATE booking_access_passes SET presence = 'outside' WHERE presence IS NULL;
UPDATE booking_access_passes SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

DO $$ BEGIN
  ALTER TABLE booking_access_passes
    ADD CONSTRAINT booking_access_passes_booking_user_unique UNIQUE (booking_id, user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS booking_access_passes_token_key ON booking_access_passes (token);
