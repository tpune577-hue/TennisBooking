import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isStaffRole } from "@/lib/access/auth";
import { getClubAccessSettings } from "@/lib/access/settings";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  enabled: z.boolean().optional(),
  graceMinutesBefore: z.number().int().min(0).max(240).optional(),
  graceMinutesAfter: z.number().int().min(0).max(240).optional(),
  maxParticipantsPerBooking: z.number().int().min(2).max(20).optional(),
  resetAllowedRoles: z.array(z.string()).optional(),
  requireResetReason: z.boolean().optional(),
});

async function requireStaff() {
  const session = await auth();
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!isStaffRole(role)) return null;
  return session;
}

export async function GET() {
  if (!(await requireStaff())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await getClubAccessSettings();
  return Response.json(settings);
}

export async function PUT(req: Request) {
  const session = await requireStaff();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const role = (session.user as { role?: string }).role;
  if (role !== "super_admin" && role !== "staff") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  await getClubAccessSettings();

  const [updated] = await db
    .update(schema.clubAccessSettings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.clubAccessSettings.id, "default"))
    .returning();

  return Response.json({
    id: updated.id,
    enabled: updated.enabled,
    graceMinutesBefore: updated.graceMinutesBefore,
    graceMinutesAfter: updated.graceMinutesAfter,
    maxParticipantsPerBooking: updated.maxParticipantsPerBooking,
    resetAllowedRoles: updated.resetAllowedRoles,
    requireResetReason: updated.requireResetReason,
  });
}
