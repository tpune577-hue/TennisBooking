#!/usr/bin/env node
/**
 * Run a .sql file against DATABASE_URL (one statement batch via neon unsafe).
 * Usage: node scripts/run-sql-file.mjs scripts/migrate-booking-access-passes-patch.sql
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql-file.mjs <path.sql>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const query = fs.readFileSync(file, "utf8");
await sql.unsafe(query);
console.log(`OK: ran ${file}`);
