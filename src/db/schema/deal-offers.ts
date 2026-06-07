import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dealOfferStatusEnum } from "./enums";
import { users } from "./users";

export const dealOffers = pgTable("deal_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  priceThb: integer("price_thb").notNull(),
  creditAmount: integer("credit_amount").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: dealOfferStatusEnum("status").notNull().default("non_paid"),
  sentViaLine: boolean("sent_via_line").notNull().default(false),
  sentViaEmail: boolean("sent_via_email").notNull().default(false),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dealOffersRelations = relations(dealOffers, ({ one }) => ({
  user: one(users, { fields: [dealOffers.userId], references: [users.id] }),
  creator: one(users, {
    fields: [dealOffers.createdBy],
    references: [users.id],
    relationName: "dealOfferCreator",
  }),
  canceller: one(users, {
    fields: [dealOffers.cancelledBy],
    references: [users.id],
    relationName: "dealOfferCanceller",
  }),
}));
