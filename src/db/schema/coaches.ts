import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  time,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { bookings } from "./bookings";

export const coachProfiles = pgTable("coach_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  pricePerHour: integer("price_per_hour").notNull().default(300),
  bio: text("bio"),
  isAvailable: boolean("is_available").notNull().default(true),
  // availability schedule: [{dayOfWeek: 0-6, startTime, endTime}]
  availabilitySchedule: jsonb("availability_schedule"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coachProfilesRelations = relations(
  coachProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [coachProfiles.userId],
      references: [users.id],
    }),
    bookings: many(bookings),
  })
);
