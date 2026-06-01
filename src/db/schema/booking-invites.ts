import { pgTable, uuid, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { bookings } from "./bookings";
import { users } from "./users";

export const bookingInvites = pgTable("booking_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  gameMode: varchar("game_mode", { length: 20 }).notNull(), // singles | doubles
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingGuests = pgTable(
  "booking_guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteId: uuid("invite_id").references(() => bookingInvites.id),
    acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  },
  (t) => [unique("booking_guests_booking_user_unique").on(t.bookingId, t.userId)]
);

export const bookingInvitesRelations = relations(bookingInvites, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [bookingInvites.bookingId],
    references: [bookings.id],
  }),
  guests: many(bookingGuests),
}));

export const bookingGuestsRelations = relations(bookingGuests, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingGuests.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [bookingGuests.userId],
    references: [users.id],
  }),
  invite: one(bookingInvites, {
    fields: [bookingGuests.inviteId],
    references: [bookingInvites.id],
  }),
}));
