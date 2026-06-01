import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  lineUserId: z.string().min(1).max(255),
});

/**
 * Store the Messaging API channel user ID from LIFF profile.
 * LINE Login OAuth may store a different ID that cannot receive bot push messages.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lineUserId } = parsed.data;
  const db = getDb();

  const taken = await db.query.users.findFirst({
    where: eq(schema.users.lineUserId, lineUserId),
    columns: { id: true },
  });

  if (taken && taken.id !== session.user.id) {
    return Response.json({ error: "LINE account already linked to another user" }, { status: 409 });
  }

  const [updated] = await db
    .update(schema.users)
    .set({ lineUserId, updatedAt: new Date() })
    .where(eq(schema.users.id, session.user.id))
    .returning({ lineUserId: schema.users.lineUserId });

  return Response.json({ lineUserId: updated.lineUserId });
}
