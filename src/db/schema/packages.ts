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
import { packageStatusEnum, memberPackageStatusEnum } from "./enums";
import { tiers } from "./tiers";
import { users } from "./users";
import { payments } from "./payments";

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  tierId: uuid("tier_id")
    .notNull()
    .references(() => tiers.id),
  durationDays: integer("duration_days").notNull(),
  price: integer("price").notNull(),
  bonusCredit: integer("bonus_credit").notNull().default(0),
  status: packageStatusEnum("status").notNull().default("active"),
  maxPurchases: integer("max_purchases"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberPackages = pgTable("member_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  packageId: uuid("package_id")
    .notNull()
    .references(() => packages.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  status: memberPackageStatusEnum("status").notNull().default("active"),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const packagesRelations = relations(packages, ({ one, many }) => ({
  tier: one(tiers, { fields: [packages.tierId], references: [tiers.id] }),
  memberPackages: many(memberPackages),
}));

export const memberPackagesRelations = relations(memberPackages, ({ one }) => ({
  user: one(users, { fields: [memberPackages.userId], references: [users.id] }),
  package: one(packages, {
    fields: [memberPackages.packageId],
    references: [packages.id],
  }),
  payment: one(payments, {
    fields: [memberPackages.paymentId],
    references: [payments.id],
  }),
}));
