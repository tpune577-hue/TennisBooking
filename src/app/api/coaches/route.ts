import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/coaches" }));

  try {
    const db = getDb();
    const coaches = await db.query.coachProfiles.findMany({
      where: eq(schema.coachProfiles.isAvailable, true),
      with: {
        user: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const result = coaches.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.user.name,
      avatarUrl: c.user.avatarUrl,
      pricePerHour: c.pricePerHour,
      bio: c.bio,
    }));

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/coaches", ms: Date.now() - start }));
    return Response.json(result);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/coaches", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
