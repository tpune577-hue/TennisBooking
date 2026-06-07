import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "coach_employee",
  "coach_freelance",
  "staff",
  "super_admin",
]);

export const courtTypeEnum = pgEnum("court_type", [
  "outdoor",
  "indoor",
  "clay",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const bookingTypeEnum = pgEnum("booking_type", [
  "court_only",
  "court_with_coach",
]);

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "topup",
  "booking",
  "refund",
  "expired",
  "adjustment",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "promptpay",
  "line_pay",
]);

export const verificationTypeEnum = pgEnum("verification_type", [
  "otp",
  "email",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "unspecified"]);

export const packageStatusEnum = pgEnum("package_status", [
  "active",
  "inactive",
]);

export const memberPackageStatusEnum = pgEnum("member_package_status", [
  "active",
  "expired",
  "cancelled",
]);

export const accessPassRoleEnum = pgEnum("access_pass_role", ["host", "guest", "coach"]);

export const dealOfferStatusEnum = pgEnum("deal_offer_status", [
  "non_paid",
  "paid",
  "expired",
  "cancelled",
]);
