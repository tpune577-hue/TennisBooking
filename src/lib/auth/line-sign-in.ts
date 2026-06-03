import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { findUserByLineUserId } from "./users";

/** Reject LINE sign-in when this OAuth user is a duplicate of an existing member. */
export async function assertLineSignInAllowed(input: {
  userId: string;
  lineProviderAccountId: string;
  profileEmail?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = getDb();
  const lineUserId = input.lineProviderAccountId;

  const byLine = await findUserByLineUserId(lineUserId);
  if (byLine && byLine.id !== input.userId) {
    return { ok: false, reason: "LINE นี้ผูกกับบัญชีสมาชิกอื่นแล้ว" };
  }

  const linkedAccount = await db.query.accounts.findFirst({
    where: and(
      eq(schema.accounts.provider, "line"),
      eq(schema.accounts.providerAccountId, lineUserId),
    ),
  });

  if (linkedAccount && linkedAccount.userId !== input.userId) {
    return { ok: false, reason: "LINE นี้ผูกกับบัญชีสมาชิกอื่นแล้ว" };
  }

  const current = await db.query.users.findFirst({
    where: eq(schema.users.id, input.userId),
    columns: {
      id: true,
      lineUserId: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
  if (!current) {
    return { ok: false, reason: "ไม่พบบัญชีผู้ใช้" };
  }

  const ageMs = Date.now() - current.createdAt.getTime();
  const isNew =
    !linkedAccount &&
    !byLine &&
    !current.lineUserId &&
    !current.isPhoneVerified &&
    !current.isEmailVerified &&
    ageMs < 5 * 60 * 1000;

  if (isNew) {
    return {
      ok: false,
      reason: "ยังไม่พบบัญชีสมาชิกสำหรับ LINE นี้ กรุณาสมัครสมาชิกก่อน แล้วผูก LINE จากหน้าหลัก",
    };
  }

  return { ok: true };
}

export async function linkLineToUser(input: {
  userId: string;
  lineUserId: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const db = getDb();
  const defaultTier = await db.query.tiers.findFirst({
    where: eq(schema.tiers.name, "Regular"),
  });

  const existing = await findUserByLineUserId(input.lineUserId);
  if (existing && existing.id !== input.userId) {
    throw new Error("LINE_ALREADY_LINKED");
  }

  await db
    .update(schema.users)
    .set({
      lineUserId: input.lineUserId,
      name: input.name ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      tierId: defaultTier?.id ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, input.userId));
}

export async function cleanupRejectedOAuthUser(userId: string) {
  const db = getDb();
  await db.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
}
