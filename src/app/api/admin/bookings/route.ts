import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

export async function GET(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/admin/bookings" }));

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const db = getDb();

    const conditions = [];
    if (status) conditions.push(eq(schema.bookings.status, status as "confirmed" | "cancelled" | "completed" | "pending" | "no_show"));
    if (dateFrom) conditions.push(gte(schema.bookings.startTime, new Date(dateFrom)));
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      conditions.push(lte(schema.bookings.startTime, end));
    }

    const bookings = await db.query.bookings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.bookings.startTime)],
      limit: 200,
      with: {
        user: { columns: { name: true, email: true, avatarUrl: true } },
        court: { columns: { name: true, type: true } },
        coach: {
          with: { user: { columns: { name: true } } },
        },
      },
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/admin/bookings", count: bookings.length, ms: Date.now() - start }));
    return Response.json(bookings);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/admin/bookings", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
