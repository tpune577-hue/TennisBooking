import { getDb, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { normalizeEmail, normalizePhoneTh } from "./normalize";

export async function findUserByPhone(rawOrNormalized: string) {
  const phone = rawOrNormalized.startsWith("+")
    ? rawOrNormalized
    : normalizePhoneTh(rawOrNormalized);
  if (!phone) return null;

  const db = getDb();
  const local = phone.replace("+66", "0");
  return db.query.users.findFirst({
    where: inArray(schema.users.phone, [phone, local]),
  });
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(schema.users.email, normalized),
  });
}

export async function findUserByLineUserId(lineUserId: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(schema.users.lineUserId, lineUserId),
  });
}

export async function findUserById(id: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
}

/** @deprecated Use registerMember from signup.ts for new members. */
export async function createMemberUser(input: {
  name: string;
  phone?: string;
  email?: string;
}) {
  const db = getDb();
  const defaultTier = await db.query.tiers.findFirst({
    where: eq(schema.tiers.name, "Regular"),
  });

  const [user] = await db
    .insert(schema.users)
    .values({
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      tierId: defaultTier?.id ?? null,
      isPhoneVerified: false,
      isEmailVerified: false,
    })
    .returning();

  return user;
}

export async function loadUserForSession(userId: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      tierId: true,
      creditBalance: true,
      lineUserId: true,
      avatarUrl: true,
    },
  });
}
