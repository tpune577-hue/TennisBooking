import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { completeProfileSchema } from "@/lib/auth/signup";
import { normalizeEmail, normalizePhoneTh } from "@/lib/auth/normalize";
import type { Gender } from "@/lib/auth/member-readiness";

export const dynamic = "force-dynamic";

const patchSchema = completeProfileSchema;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phone = normalizePhoneTh(parsed.data.phone);
  const email = normalizeEmail(parsed.data.email);
  if (!phone || !email) {
    return Response.json({ error: "เบอร์หรืออีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  const db = getDb();
  const target = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    columns: { id: true },
  });
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });

  const phoneConflict = await db.query.users.findFirst({
    where: eq(schema.users.phone, phone),
    columns: { id: true },
  });
  if (phoneConflict && phoneConflict.id !== id) {
    return Response.json({ error: "เบอร์นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const emailConflict = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
    columns: { id: true },
  });
  if (emailConflict && emailConflict.id !== id) {
    return Response.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const displayName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const [updated] = await db
    .update(schema.users)
    .set({
      name: displayName,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone,
      email,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender as Gender,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id))
    .returning({
      id: schema.users.id,
      name: schema.users.name,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      email: schema.users.email,
      phone: schema.users.phone,
      dateOfBirth: schema.users.dateOfBirth,
      gender: schema.users.gender,
    });

  return Response.json(updated);
}
