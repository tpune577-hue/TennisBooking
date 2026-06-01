import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq, desc } from "drizzle-orm";
import { getClubAccessSettings, maxGuestSlots } from "@/lib/access/settings";
import { countBookingGuests } from "@/lib/access/passes";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.id, bookingId),
      eq(schema.bookings.userId, userId),
      eq(schema.bookings.status, "confirmed")
    ),
    columns: { id: true, bookingRef: true },
  });

  if (!booking) return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const settings = await getClubAccessSettings();
  const guestCount = await countBookingGuests(bookingId);
  const maxGuests = maxGuestSlots(settings);
  const slotsFull = guestCount >= maxGuests;

  const invite = await db.query.bookingInvites.findFirst({
    where: eq(schema.bookingInvites.bookingId, bookingId),
    orderBy: [desc(schema.bookingInvites.createdAt)],
  });

  const guests = await db.query.bookingGuests.findMany({
    where: eq(schema.bookingGuests.bookingId, bookingId),
    with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
    orderBy: [desc(schema.bookingGuests.acceptedAt)],
  });

  return Response.json({
    bookingId,
    bookingRef: booking.bookingRef,
    guestCount,
    maxGuests,
    slotsFull,
    inviteToken: invite?.token ?? null,
    guests: guests.map((g) => ({
      userId: g.user.id,
      name: g.user.name,
      avatarUrl: g.user.avatarUrl,
      acceptedAt: g.acceptedAt,
    })),
  });
}
