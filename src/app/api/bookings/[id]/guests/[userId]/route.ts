import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { revokeGuestPass } from "@/lib/access/passes";
import { pushText } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: bookingId, userId: guestUserId } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const hostId = (session.user as { id: string }).id;
  const db = getDb();

  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.id, bookingId),
      eq(schema.bookings.userId, hostId),
      eq(schema.bookings.status, "confirmed")
    ),
    columns: { id: true, bookingRef: true },
  });

  if (!booking) return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const guest = await db.query.bookingGuests.findFirst({
    where: and(
      eq(schema.bookingGuests.bookingId, bookingId),
      eq(schema.bookingGuests.userId, guestUserId)
    ),
    with: { user: { columns: { lineUserId: true, name: true } } },
  });

  if (!guest) return Response.json({ error: "ไม่พบแขกในก๊วนนี้" }, { status: 404 });

  await db
    .delete(schema.bookingGuests)
    .where(
      and(
        eq(schema.bookingGuests.bookingId, bookingId),
        eq(schema.bookingGuests.userId, guestUserId)
      )
    );

  await revokeGuestPass({
    bookingId,
    userId: guestUserId,
    reason: "removed_by_host",
  });

  if (guest.user.lineUserId) {
    void pushText(
      guest.user.lineUserId,
      `คุณถูกถอนออกจากก๊วนการจอง ${booking.bookingRef} โดยเจ้าของการจอง`
    );
  }

  return Response.json({ ok: true });
}
