import { z } from "zod";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import {
  getMemberFieldLocks,
  type MemberReadinessInput,
} from "./member-readiness";
import { normalizeEmail, normalizePhoneTh } from "./normalize";
import { findUserByEmail, findUserByPhone } from "./users";
import { VerificationError } from "./verification";

export const memberContactPatchSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().min(8).max(20).optional(),
    email: z.string().email().max(255).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "ไม่มีข้อมูลที่จะบันทึก",
  });

export type MemberContactPatch = z.infer<typeof memberContactPatchSchema>;

export async function patchMemberContact(
  userId: string,
  input: MemberContactPatch,
  current: MemberReadinessInput,
) {
  const locks = getMemberFieldLocks(current);
  const updates: Record<string, string> = {};

  if (input.firstName !== undefined) {
    if (locks.firstName) {
      throw new VerificationError("ชื่อถูกยืนยันแล้ว แก้ไขได้เฉพาะผู้ดูแลระบบ");
    }
    updates.firstName = input.firstName;
  }
  if (input.lastName !== undefined) {
    if (locks.lastName) {
      throw new VerificationError("นามสกุลถูกยืนยันแล้ว แก้ไขได้เฉพาะผู้ดูแลระบบ");
    }
    updates.lastName = input.lastName;
  }
  if (input.phone !== undefined) {
    if (locks.phone) {
      throw new VerificationError("เบอร์โทรยืนยันแล้ว แก้ไขได้เฉพาะผู้ดูแลระบบ");
    }
    const phone = normalizePhoneTh(input.phone);
    if (!phone) throw new VerificationError("เบอร์โทรไม่ถูกต้อง");
    const conflict = await findUserByPhone(phone);
    if (conflict && conflict.id !== userId) {
      throw new VerificationError("เบอร์นี้ถูกใช้โดยสมาชิกอื่นแล้ว", 409);
    }
    updates.phone = phone;
  }
  if (input.email !== undefined) {
    if (locks.email) {
      throw new VerificationError("อีเมลยืนยันแล้ว แก้ไขได้เฉพาะผู้ดูแลระบบ");
    }
    const email = normalizeEmail(input.email);
    if (!email) throw new VerificationError("อีเมลไม่ถูกต้อง");
    const conflict = await findUserByEmail(email);
    if (conflict && conflict.id !== userId) {
      throw new VerificationError("อีเมลนี้ถูกใช้โดยสมาชิกอื่นแล้ว", 409);
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    throw new VerificationError("ไม่มีข้อมูลที่แก้ไขได้");
  }

  const db = getDb();
  const set: Record<string, unknown> = { updatedAt: new Date(), ...updates };

  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const first = (updates.firstName ?? current.firstName ?? "").trim();
    const last = (updates.lastName ?? current.lastName ?? "").trim();
    const display = `${first} ${last}`.trim();
    if (display) set.name = display;
  }

  await db.update(schema.users).set(set).where(eq(schema.users.id, userId));
}
