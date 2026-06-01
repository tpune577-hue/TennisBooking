import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const updateSchema = z.object({
  pricePerHour: z.number().int().min(100).max(10000).optional(),
  bio: z.string().max(500).optional(),
  isAvailable: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const db = getDb();
    const [coach] = await db
      .update(schema.coachProfiles)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.coachProfiles.id, id))
      .returning();

    if (!coach) return Response.json({ error: "Not found" }, { status: 404 });

    console.log(JSON.stringify({ level: "info", msg: "coach_updated", id, ms: Date.now() - start }));
    return Response.json(coach);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "coach_update_failed", id, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (role !== "super_admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const db = getDb();
    const [coach] = await db
      .delete(schema.coachProfiles)
      .where(eq(schema.coachProfiles.id, id))
      .returning();

    if (!coach) return Response.json({ error: "Not found" }, { status: 404 });

    console.log(JSON.stringify({ level: "info", msg: "coach_deleted", id, ms: Date.now() - start }));
    return Response.json({ success: true });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "coach_delete_failed", id, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
