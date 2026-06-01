-- Run in Neon SQL Editor if `npm run db:push` cannot complete interactively.
-- Creates tables for invite links and guests (required for admin cancel + guest LINE notify).

CREATE TABLE IF NOT EXISTS booking_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token varchar(64) NOT NULL UNIQUE,
  game_mode varchar(20) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_id uuid REFERENCES booking_invites(id),
  accepted_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT booking_guests_booking_user_unique UNIQUE (booking_id, user_id)
);
