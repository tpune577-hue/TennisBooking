import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { accessPassRoleEnum } from "./enums";
import { bookings } from "./bookings";
import { users } from "./users";

export const clubAccessSettings = pgTable("club_access_settings", {
  id: varchar("id", { length: 32 }).primaryKey().default("default"),
  enabled: boolean("enabled").notNull().default(true),
  graceMinutesBefore: integer("grace_minutes_before").notNull().default(60),
  graceMinutesAfter: integer("grace_minutes_after").notNull().default(60),
  maxParticipantsPerBooking: integer("max_participants_per_booking").notNull().default(6),
  resetAllowedRoles: jsonb("reset_allowed_roles")
    .$type<string[]>()
    .notNull()
    .default(["staff", "super_admin"]),
  requireResetReason: boolean("require_reset_reason").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingAccessPasses = pgTable(
  "booking_access_passes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: accessPassRoleEnum("role").notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | revoked
    presence: varchar("presence", { length: 20 }).notNull().default("outside"), // outside | inside
    revokedAt: timestamp("revoked_at"),
    revokeReason: text("revoke_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("booking_access_passes_booking_user_unique").on(t.bookingId, t.userId)]
);

export const accessScanEvents = pgTable("access_scan_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  passId: uuid("pass_id").references(() => bookingAccessPasses.id, { onDelete: "set null" }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  result: varchar("result", { length: 40 }).notNull(),
  presenceBefore: varchar("presence_before", { length: 20 }),
  presenceAfter: varchar("presence_after", { length: 20 }),
  actorType: varchar("actor_type", { length: 20 }).notNull(), // staff | device
  actorUserId: uuid("actor_user_id").references(() => users.id),
  forcedDirection: varchar("forced_direction", { length: 10 }),
  resetPerformed: boolean("reset_performed").notNull().default(false),
  reason: text("reason"),
  message: text("message"),
});

export const bookingAccessPassesRelations = relations(bookingAccessPasses, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAccessPasses.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [bookingAccessPasses.userId],
    references: [users.id],
  }),
}));
