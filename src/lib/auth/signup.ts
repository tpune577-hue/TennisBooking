import { z } from "zod";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { Gender } from "./member-readiness";
import { normalizeEmail, normalizePhoneTh } from "./normalize";
import { findUserByEmail, findUserByPhone } from "./users";
import { VerificationError } from "./verification";

export const signupBodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันเกิดไม่ถูกต้อง"),
  gender: z.enum(["male", "female", "unspecified"]),
});

export type SignupInput = z.infer<typeof signupBodySchema>;

export async function registerMember(input: SignupInput) {
  const phone = normalizePhoneTh(input.phone);
  const email = normalizeEmail(input.email);
  if (!phone) throw new VerificationError("เบอร์โทรไม่ถูกต้อง");
  if (!email) throw new VerificationError("อีเมลไม่ถูกต้อง");

  if (await findUserByPhone(phone)) {
    throw new VerificationError("เบอร์นี้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ", 409);
  }
  if (await findUserByEmail(email)) {
    throw new VerificationError("อีเมลนี้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ", 409);
  }

  const db = getDb();
  const defaultTier = await db.query.tiers.findFirst({
    where: eq(schema.tiers.name, "Regular"),
  });

  const displayName = `${input.firstName} ${input.lastName}`.trim();

  const [user] = await db
    .insert(schema.users)
    .values({
      name: displayName,
      firstName: input.firstName,
      lastName: input.lastName,
      phone,
      email,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender as Gender,
      tierId: defaultTier?.id ?? null,
      isPhoneVerified: false,
      isEmailVerified: false,
    })
    .returning({ id: schema.users.id });

  return { userId: user.id, phone, email };
}

export const completeProfileSchema = signupBodySchema;

export async function completeMemberProfile(
  userId: string,
  input: SignupInput,
) {
  const phone = normalizePhoneTh(input.phone);
  const email = normalizeEmail(input.email);
  if (!phone) throw new VerificationError("เบอร์โทรไม่ถูกต้อง");
  if (!email) throw new VerificationError("อีเมลไม่ถูกต้อง");

  const existingPhone = await findUserByPhone(phone);
  if (existingPhone && existingPhone.id !== userId) {
    throw new VerificationError("เบอร์นี้ถูกใช้โดยสมาชิกอื่นแล้ว", 409);
  }
  const existingEmail = await findUserByEmail(email);
  if (existingEmail && existingEmail.id !== userId) {
    throw new VerificationError("อีเมลนี้ถูกใช้โดยสมาชิกอื่นแล้ว", 409);
  }

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const db = getDb();
  await db
    .update(schema.users)
    .set({
      name: displayName,
      firstName: input.firstName,
      lastName: input.lastName,
      phone,
      email,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender as Gender,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return { phone, email };
}
