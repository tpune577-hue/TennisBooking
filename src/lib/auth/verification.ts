import { getDb, schema } from "@/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { normalizeEmail, normalizePhoneTh } from "./normalize";
import { findUserByEmail, findUserByPhone } from "./users";

const OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export class VerificationError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "VerificationError";
  }
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateEmailToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function assertCooldown(target: string, type: "otp" | "email") {
  const db = getDb();
  const recent = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.target, target),
      eq(schema.verificationTokens.type, type),
      gt(schema.verificationTokens.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS)),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  if (recent) {
    throw new VerificationError("รอสักครู่แล้วลองส่งอีกครั้ง", 429);
  }
}

async function resolveUserForPhoneSignIn(phone: string) {
  const user = await findUserByPhone(phone);
  if (!user) {
    throw new VerificationError(
      "ไม่พบสมาชิกที่ลงทะเบียนด้วยเบอร์นี้ กรุณาสมัครสมาชิกหรือติดต่อสโมสร",
      404,
    );
  }
  return user;
}

async function resolveUserForEmailSignIn(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new VerificationError(
      "ไม่พบสมาชิกที่ลงทะเบียนด้วยอีเมลนี้ กรุณาสมัครสมาชิกหรือติดต่อสโมสร",
      404,
    );
  }
  return user;
}

/** OTP for an existing user (sign-in or post-signup verification). */
export async function createPhoneOtp(rawPhone: string): Promise<{ phone: string; code: string }> {
  const phone = normalizePhoneTh(rawPhone);
  if (!phone) throw new VerificationError("เบอร์โทรไม่ถูกต้อง");

  await assertCooldown(phone, "otp");
  const user = await resolveUserForPhoneSignIn(phone);
  const code = generateOtp();

  const db = getDb();
  await db.insert(schema.verificationTokens).values({
    userId: user.id,
    type: "otp",
    token: code,
    target: phone,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return { phone, code };
}

export async function createEmailMagicLink(rawEmail: string): Promise<{ email: string; token: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new VerificationError("อีเมลไม่ถูกต้อง");

  await assertCooldown(email, "email");
  const user = await resolveUserForEmailSignIn(email);
  const token = generateEmailToken();

  const db = getDb();
  await db.insert(schema.verificationTokens).values({
    userId: user.id,
    type: "email",
    token,
    target: email,
    expiresAt: new Date(Date.now() + EMAIL_TTL_MS),
  });

  return { email, token };
}

export async function verifyPhoneOtp(
  rawPhone: string,
  code: string,
): Promise<{ userId: string }> {
  const phone = normalizePhoneTh(rawPhone);
  if (!phone || !/^\d{6}$/.test(code.trim())) {
    throw new VerificationError("เบอร์หรือรหัสไม่ถูกต้อง");
  }

  const db = getDb();
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.type, "otp"),
      eq(schema.verificationTokens.target, phone),
      eq(schema.verificationTokens.token, code.trim()),
      isNull(schema.verificationTokens.usedAt),
      gt(schema.verificationTokens.expiresAt, new Date()),
    ),
  });

  if (!row) throw new VerificationError("รหัสไม่ถูกต้องหรือหมดอายุ");

  await db
    .update(schema.verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.verificationTokens.id, row.id));

  await db
    .update(schema.users)
    .set({ phone, isPhoneVerified: true, updatedAt: new Date() })
    .where(eq(schema.users.id, row.userId));

  return { userId: row.userId };
}

export async function verifyEmailToken(token: string): Promise<{ userId: string }> {
  const trimmed = token.trim();
  if (!trimmed) throw new VerificationError("ลิงก์ไม่ถูกต้อง");

  const db = getDb();
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.type, "email"),
      eq(schema.verificationTokens.token, trimmed),
      isNull(schema.verificationTokens.usedAt),
      gt(schema.verificationTokens.expiresAt, new Date()),
    ),
  });

  if (!row) throw new VerificationError("ลิงก์ไม่ถูกต้องหรือหมดอายุ");

  await db
    .update(schema.verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.verificationTokens.id, row.id));

  await db
    .update(schema.users)
    .set({
      email: row.target,
      isEmailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, row.userId));

  return { userId: row.userId };
}
