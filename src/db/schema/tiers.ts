import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const tiers = pgTable("tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  maxSlots: integer("max_slots").notNull(),
  currentSlots: integer("current_slots").notNull().default(0),
  discountPercent: integer("discount_percent").notNull().default(0),
  advanceBookingDays: integer("advance_booking_days").notNull().default(7),
  maxBookingsPerDay: integer("max_bookings_per_day").notNull().default(2),
  maxHoursPerBooking: integer("max_hours_per_booking").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tiersRelations = relations(tiers, ({ many }) => ({
  users: many(users),
}));
