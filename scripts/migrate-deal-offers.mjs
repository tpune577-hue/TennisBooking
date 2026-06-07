#!/usr/bin/env node
/**
 * Apply deal_offers schema via Neon WebSocket (HTTP driver cannot run DDL).
 * Usage: dotenv -e .env.local -- node scripts/migrate-deal-offers.mjs
 */
import ws from "ws";
import { neonConfig, Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const statements = [
  `DO $$ BEGIN
    CREATE TYPE deal_offer_status AS ENUM ('non_paid', 'paid', 'expired', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS deal_offers (
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
  )`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS deal_offer_id uuid REFERENCES deal_offers(id)`,
];

try {
  for (const statement of statements) {
    await pool.query(statement);
    console.log("OK:", statement.split("\n")[0].slice(0, 60));
  }
  console.log("Deal offers migration complete.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
