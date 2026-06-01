import { getDb, schema } from "@/db";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/courts" }));

  try {
    const db = getDb();
    const courts = await db.query.courts.findMany({
      where: eq(schema.courts.isActive, true),
      orderBy: [asc(schema.courts.sortOrder)],
      with: { pricing: true },
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/courts", ms: Date.now() - start }));
    return Response.json(courts);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/courts", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
