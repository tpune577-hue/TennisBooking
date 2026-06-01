import {
  pgTable,
  uuid,
  integer,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { creditTransactionTypeEnum } from "./enums";
import { users } from "./users";
import { bookings } from "./bookings";
import { payments } from "./payments";

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: creditTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // positive = add, negative = deduct
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  expiresAt: timestamp("expires_at"), // 365 days from topup date
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Track credit batches for expiry (FIFO)
export const creditBatches = pgTable("credit_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalAmount: integer("original_amount").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  paymentId: uuid("payment_id").references(() => payments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditBatchesRelations = relations(creditBatches, ({ one }) => ({
  user: one(users, { fields: [creditBatches.userId], references: [users.id] }),
  payment: one(payments, { fields: [creditBatches.paymentId], references: [payments.id] }),
}));

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [creditTransactions.userId],
      references: [users.id],
    }),
    booking: one(bookings, {
      fields: [creditTransactions.bookingId],
      references: [bookings.id],
    }),
    payment: one(payments, {
      fields: [creditTransactions.paymentId],
      references: [payments.id],
    }),
  })
);
