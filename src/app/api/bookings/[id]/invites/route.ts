import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  gameMode: z.enum(["singles", "doubles"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.id, bookingId),
      eq(schema.bookings.userId, session.user.id),
      eq(schema.bookings.status, "confirmed")
    ),
    columns: { id: true },
  });

  if (!booking) return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const token = randomBytes(16).toString("hex");

  const [invite] = await db
    .insert(schema.bookingInvites)
    .values({
      bookingId,
      token,
      gameMode: parsed.data.gameMode,
    })
    .returning();

  return Response.json({ token: invite.token, gameMode: invite.gameMode });
}
