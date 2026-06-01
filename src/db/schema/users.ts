import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userRoleEnum, verificationTypeEnum } from "./enums";
import { tiers } from "./tiers";
import { creditTransactions } from "./credits";
import { bookings } from "./bookings";
import { memberPackages } from "./packages";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  lineUserId: varchar("line_user_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("customer"),
  tierId: uuid("tier_id").references(() => tiers.id),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  creditBalance: integer("credit_balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: verificationTypeEnum("type").notNull(),
  token: varchar("token", { length: 10 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  tier: one(tiers, { fields: [users.tierId], references: [tiers.id] }),
  creditTransactions: many(creditTransactions),
  bookings: many(bookings),
  memberPackages: many(memberPackages),
}));
