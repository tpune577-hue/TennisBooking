import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "POST /api/setup/promote-admin" }));

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return Response.json({ error: "Missing or invalid secret" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Not logged in. Sign in first, then call this endpoint." }, { status: 401 });
  }

  try {
    const userId = (session.user as { id: string }).id;
    const db = getDb();

    const existingAdmin = await db.query.users.findFirst({
      where: eq(schema.users.role, "super_admin"),
      columns: { id: true, name: true, lineUserId: true },
    });

    if (existingAdmin?.lineUserId && existingAdmin.id !== userId) {
      return Response.json({ error: "super_admin already exists", admin: existingAdmin.name }, { status: 409 });
    }

    await db
      .update(schema.users)
      .set({ role: "super_admin", updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { id: true, name: true, role: true },
    });

    console.log(JSON.stringify({ level: "info", msg: "promoted", userId, ms: Date.now() - start }));
    return Response.json({
      ok: true,
      message: "Role updated. Sign out and sign in again to refresh session.",
      user,
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "promote_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
