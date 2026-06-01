import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { paymentStatusEnum, paymentMethodEnum } from "./enums";
import { users } from "./users";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // in THB satang (x100)
  creditAmount: integer("credit_amount").notNull(), // credits to be added
  status: paymentStatusEnum("status").notNull().default("pending"),
  method: paymentMethodEnum("method"),
  omiseChargeId: varchar("omise_charge_id", { length: 255 }).unique(),
  omiseSourceId: varchar("omise_source_id", { length: 255 }),
  description: text("description"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  failureMessage: text("failure_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));
