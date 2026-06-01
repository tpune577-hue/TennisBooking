import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const createCourtSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["outdoor", "indoor", "clay"]),
  description: z.string().optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).default("06:00"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).default("22:00"),
  peakPricePerHour: z.number().int().positive(),
  offPeakPricePerHour: z.number().int().positive(),
  peakStartTime: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
  peakEndTime: z.string().regex(/^\d{2}:\d{2}$/).default("21:00"),
});

export async function GET(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/admin/courts" }));

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const courts = await db.query.courts.findMany({
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
      with: { pricing: true },
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/admin/courts", count: courts.length, ms: Date.now() - start }));
    return Response.json(courts);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/admin/courts", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "POST /api/admin/courts" }));

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCourtSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const { peakPricePerHour, offPeakPricePerHour, peakStartTime, peakEndTime, ...courtData } = parsed.data;

    const [court] = await db.insert(schema.courts).values(courtData).returning();
    await db.insert(schema.courtPricing).values({
      courtId: court.id,
      peakPricePerHour,
      offPeakPricePerHour,
      peakStartTime,
      peakEndTime,
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "POST /api/admin/courts", courtId: court.id, ms: Date.now() - start }));
    return Response.json(court, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "POST /api/admin/courts", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
