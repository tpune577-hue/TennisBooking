import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getClubAccessSettings } from "@/lib/access/settings";
import { canResetAccess, isStaffRole } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "customer";
  const settings = await getClubAccessSettings();

  if (!isStaffRole(role) || !canResetAccess(role, settings.resetAllowedRoles)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (settings.requireResetReason && !parsed.data.reason.trim()) {
    return Response.json({ error: "ต้องระบุเหตุผล" }, { status: 400 });
  }

  const db = getDb();
  const pass = await db.query.bookingAccessPasses.findFirst({
    where: eq(schema.bookingAccessPasses.id, id),
  });

  if (!pass) return Response.json({ error: "Not found" }, { status: 404 });

  const presenceBefore = pass.presence;
  const now = new Date();

  await db
    .update(schema.bookingAccessPasses)
    .set({ presence: "outside", updatedAt: now })
    .where(eq(schema.bookingAccessPasses.id, id));

  await db.insert(schema.accessScanEvents).values({
    passId: id,
    bookingId: pass.bookingId,
    result: "reset",
    presenceBefore,
    presenceAfter: "outside",
    actorType: "staff",
    actorUserId: (session.user as { id: string }).id,
    resetPerformed: true,
    reason: parsed.data.reason,
    message: "Staff reset presence to outside",
  });

  return Response.json({ ok: true, presence: "outside" });
}
