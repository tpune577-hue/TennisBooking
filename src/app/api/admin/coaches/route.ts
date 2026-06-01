import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

export async function GET(_req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/admin/coaches" }));

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const db = getDb();
    const coaches = await db.query.coachProfiles.findMany({
      orderBy: [desc(schema.coachProfiles.createdAt)],
      with: {
        user: { columns: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/admin/coaches", count: coaches.length, ms: Date.now() - start }));
    return Response.json(coaches);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/admin/coaches", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createCoachSchema = z.object({
  userId: z.string().uuid(),
  pricePerHour: z.number().int().min(100).max(10000),
  bio: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const start = Date.now();
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = createCoachSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const { userId, pricePerHour, bio } = parsed.data;
    const db = getDb();

    const [coach] = await db
      .insert(schema.coachProfiles)
      .values({ userId, pricePerHour, bio, isAvailable: true })
      .returning();

    console.log(JSON.stringify({ level: "info", msg: "coach_created", coachId: coach.id, ms: Date.now() - start }));
    return Response.json(coach, { status: 201 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("unique")) {
      return Response.json({ error: "ผู้ใช้นี้เป็น coach อยู่แล้ว" }, { status: 409 });
    }
    console.error(JSON.stringify({ level: "error", msg: "coach_create_failed", error: msg, ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
