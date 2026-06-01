import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const updateCourtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["outdoor", "indoor", "clay"]).optional(),
  description: z.string().nullable().optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const { id } = await params;
  console.log(JSON.stringify({ level: "info", msg: "start", route: `PATCH /api/admin/courts/${id}` }));

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateCourtSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(schema.courts)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.courts.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Court not found" }, { status: 404 });
    }

    console.log(JSON.stringify({ level: "info", msg: "done", route: `PATCH /api/admin/courts/${id}`, ms: Date.now() - start }));
    return Response.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: `PATCH /api/admin/courts/${id}`, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const { id } = await params;
  console.log(JSON.stringify({ level: "info", msg: "start", route: `DELETE /api/admin/courts/${id}` }));

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    // Soft delete — mark inactive instead of hard delete
    const [updated] = await db
      .update(schema.courts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.courts.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Court not found" }, { status: 404 });
    }

    console.log(JSON.stringify({ level: "info", msg: "done", route: `DELETE /api/admin/courts/${id}`, ms: Date.now() - start }));
    return Response.json({ success: true });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: `DELETE /api/admin/courts/${id}`, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
