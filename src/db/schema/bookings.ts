import {
  pgTable,
  uuid,
  integer,
  timestamp,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { bookingStatusEnum, bookingTypeEnum } from "./enums";
import { users } from "./users";
import { courts } from "./courts";
import { coachProfiles } from "./coaches";
import { bookingGuests, bookingInvites } from "./booking-invites";
import { bookingAccessPasses } from "./access";

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingRef: text("booking_ref").notNull().unique(), // e.g. BK-20260601-001
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id),
  coachId: uuid("coach_id").references(() => coachProfiles.id),
  type: bookingTypeEnum("type").notNull().default("court_only"),
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationHours: integer("duration_hours").notNull(),
  courtCreditCost: integer("court_credit_cost").notNull(),
  coachCreditCost: integer("coach_credit_cost").notNull().default(0),
  totalCreditCost: integer("total_credit_cost").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  creditRefunded: boolean("credit_refunded").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  court: one(courts, { fields: [bookings.courtId], references: [courts.id] }),
  coach: one(coachProfiles, {
    fields: [bookings.coachId],
    references: [coachProfiles.id],
  }),
  guests: many(bookingGuests),
  invites: many(bookingInvites),
  accessPasses: many(bookingAccessPasses),
}));
