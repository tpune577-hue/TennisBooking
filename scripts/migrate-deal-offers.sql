-- Deal offers: run in Neon SQL Editor or:
-- DATABASE_URL=... node scripts/run-sql-file.mjs scripts/migrate-deal-offers.sql

DO $$ BEGIN
  CREATE TYPE deal_offer_status AS ENUM ('non_paid', 'paid', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS deal_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_thb integer NOT NULL,
  credit_amount integer NOT NULL,
  expires_at timestamp NOT NULL,
  status deal_offer_status NOT NULL DEFAULT 'non_paid',
  sent_via_line boolean NOT NULL DEFAULT false,
  sent_via_email boolean NOT NULL DEFAULT false,
  sent_at timestamp,
  paid_at timestamp,
  cancelled_at timestamp,
  created_by uuid NOT NULL REFERENCES users(id),
  cancelled_by uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS deal_offer_id uuid REFERENCES deal_offers(id);
