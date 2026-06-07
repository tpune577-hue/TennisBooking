import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const adminId = (session.user as { id: string }).id;

  const { id } = await params;

  try {
    const db = getDb();
    const now = new Date();

    const [updated] = await db
      .update(schema.dealOffers)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: adminId,
      })
      .where(
        and(eq(schema.dealOffers.id, id), eq(schema.dealOffers.status, "non_paid"))
      )
      .returning();

    if (!updated) {
      return Response.json({ error: "ไม่พบ Deal หรือยกเลิกไม่ได้ (ต้องเป็นสถานะ Non Paid)" }, { status: 400 });
    }

    return Response.json({ offer: updated });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "deal_cancel_failed", id, error: String(err) }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
