import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getClubAccessSettings, maxGuestSlots } from "@/lib/access/settings";
import { countBookingGuests } from "@/lib/access/passes";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

  const settings = await getClubAccessSettings();
  const guestCount = await countBookingGuests(bookingId);
  const maxGuests = maxGuestSlots(settings);

  const invite = await db.query.bookingInvites.findFirst({
    where: eq(schema.bookingInvites.bookingId, bookingId),
    orderBy: [desc(schema.bookingInvites.createdAt)],
  });

  return Response.json({
    token: invite?.token ?? null,
    guestCount,
    maxGuests,
    slotsFull: guestCount >= maxGuests,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

  const settings = await getClubAccessSettings();
  const guestCount = await countBookingGuests(bookingId);
  const maxGuests = maxGuestSlots(settings);

  if (guestCount >= maxGuests) {
    return Response.json(
      { error: "แขกครบแล้ว", code: "GUEST_SLOTS_FULL", guestCount, maxGuests },
      { status: 409 }
    );
  }

  const existing = await db.query.bookingInvites.findFirst({
    where: eq(schema.bookingInvites.bookingId, bookingId),
    orderBy: [desc(schema.bookingInvites.createdAt)],
  });

  if (existing) {
    return Response.json({
      token: existing.token,
      gameMode: existing.gameMode,
      guestCount,
      maxGuests,
      slotsFull: false,
      reused: true,
    });
  }

  const token = randomBytes(16).toString("hex");

  const [invite] = await db
    .insert(schema.bookingInvites)
    .values({
      bookingId,
      token,
      gameMode: "open",
    })
    .returning();

  return Response.json({
    token: invite.token,
    gameMode: invite.gameMode,
    guestCount,
    maxGuests,
    slotsFull: false,
    reused: false,
  });
}
