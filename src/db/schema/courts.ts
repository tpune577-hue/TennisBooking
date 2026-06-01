import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  time,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { courtTypeEnum } from "./enums";
import { bookings } from "./bookings";

export const courts = pgTable("courts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  type: courtTypeEnum("type").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  openTime: time("open_time").notNull().default("06:00"),
  closeTime: time("close_time").notNull().default("22:00"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// pricing per court: { peakPrice, offPeakPrice, peakStartTime, peakEndTime }
// stored per tier override — base price in court_pricing, tier discounts applied from tier.discountPercent
export const courtPricing = pgTable("court_pricing", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  peakPricePerHour: integer("peak_price_per_hour").notNull(),
  offPeakPricePerHour: integer("off_peak_price_per_hour").notNull(),
  peakStartTime: time("peak_start_time").notNull().default("17:00"),
  peakEndTime: time("peak_end_time").notNull().default("21:00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courtClosures = pgTable("court_closures", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  reason: text("reason"),
  closedFrom: timestamp("closed_from").notNull(),
  closedUntil: timestamp("closed_until").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courtsRelations = relations(courts, ({ one, many }) => ({
  pricing: one(courtPricing, {
    fields: [courts.id],
    references: [courtPricing.courtId],
  }),
  closures: many(courtClosures),
  bookings: many(bookings),
}));

export const courtPricingRelations = relations(courtPricing, ({ one }) => ({
  court: one(courts, {
    fields: [courtPricing.courtId],
    references: [courts.id],
  }),
}));
