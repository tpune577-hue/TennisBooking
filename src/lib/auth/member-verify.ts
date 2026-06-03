import { getDb, schema } from "@/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { normalizeEmail } from "./normalize";
import { VerificationError } from "./verification";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
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

export async function sendMemberPhoneOtp(userId: string): Promise<{ phone: string; code: string }> {
  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { id: true, phone: true, isPhoneVerified: true },
  });
  if (!user?.phone?.trim()) {
    throw new VerificationError("กรุณาบันทึกเบอร์โทรก่อนยืนยัน");
  }
  if (user.isPhoneVerified) {
    throw new VerificationError("เบอร์โทรยืนยันแล้ว");
  }

  const phone = user.phone;
  await assertCooldown(phone, "otp");
  const code = generateOtp();

  await db.insert(schema.verificationTokens).values({
    userId,
    type: "otp",
    token: code,
    target: phone,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return { phone, code };
}

export async function confirmMemberPhoneOtp(
  userId: string,
  code: string,
): Promise<void> {
  if (!/^\d{6}$/.test(code.trim())) {
    throw new VerificationError("รหัสต้องเป็นตัวเลข 6 หลัก");
  }

  const db = getDb();
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.userId, userId),
      eq(schema.verificationTokens.type, "otp"),
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
    .set({ phone: row.target, isPhoneVerified: true, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function sendMemberEmailOtp(userId: string): Promise<{ email: string; code: string }> {
  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { id: true, email: true, isEmailVerified: true },
  });
  const email = normalizeEmail(user?.email ?? "");
  if (!email) {
    throw new VerificationError("กรุณาบันทึกอีเมลก่อนยืนยัน");
  }
  if (user?.isEmailVerified) {
    throw new VerificationError("อีเมลยืนยันแล้ว");
  }

  await assertCooldown(email, "email");
  const code = generateOtp();

  await db.insert(schema.verificationTokens).values({
    userId,
    type: "email",
    token: code,
    target: email,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return { email, code };
}

export async function confirmMemberEmailOtp(
  userId: string,
  code: string,
): Promise<void> {
  if (!/^\d{6}$/.test(code.trim())) {
    throw new VerificationError("รหัสต้องเป็นตัวเลข 6 หลัก");
  }

  const db = getDb();
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.userId, userId),
      eq(schema.verificationTokens.type, "email"),
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
    .set({
      email: row.target,
      isEmailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));
}
