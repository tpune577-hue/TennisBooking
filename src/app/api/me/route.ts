import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.user.id),
    columns: { creditBalance: true },
  });

  if (!user) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ creditBalance: user.creditBalance });
}
