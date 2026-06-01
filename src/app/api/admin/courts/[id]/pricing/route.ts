import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const pricingSchema = z.object({
  peakPricePerHour: z.number().int().positive(),
  offPeakPricePerHour: z.number().int().positive(),
  peakStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  peakEndTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const { id } = await params;
  console.log(JSON.stringify({ level: "info", msg: "start", route: `PATCH /api/admin/courts/${id}/pricing` }));

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = pricingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(schema.courtPricing)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.courtPricing.courtId, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Pricing not found" }, { status: 404 });
    }

    console.log(JSON.stringify({ level: "info", msg: "done", route: `PATCH /api/admin/courts/${id}/pricing`, ms: Date.now() - start }));
    return Response.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: `PATCH /api/admin/courts/${id}/pricing`, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
