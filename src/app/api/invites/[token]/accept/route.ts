import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { getClubAccessSettings, maxGuestSlots } from "@/lib/access/settings";
import { countBookingGuests, createAccessPass } from "@/lib/access/passes";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const invite = await db.query.bookingInvites.findFirst({
    where: eq(schema.bookingInvites.token, token),
    with: {
      booking: { columns: { id: true, userId: true, status: true } },
    },
  });

  if (!invite || invite.booking.status !== "confirmed") {
    return Response.json({ error: "ไม่พบคำเชิญหรือการจองถูกยกเลิกแล้ว" }, { status: 404 });
  }

  if (invite.booking.userId === session.user.id) {
    return Response.json({ error: "คุณเป็นเจ้าของการจองอยู่แล้ว" }, { status: 400 });
  }

  const settings = await getClubAccessSettings();
  const guestCount = await countBookingGuests(invite.booking.id);
  const maxGuests = maxGuestSlots(settings);

  const existing = await db.query.bookingGuests.findFirst({
    where: and(
      eq(schema.bookingGuests.bookingId, invite.booking.id),
      eq(schema.bookingGuests.userId, session.user.id)
    ),
  });

  if (existing) {
    return Response.json({ success: true, alreadyAccepted: true, bookingId: invite.booking.id });
  }

  if (guestCount >= maxGuests) {
    return Response.json(
      {
        error: "คิวเชิญเต็มแล้ว",
        code: "GUEST_SLOTS_FULL",
        guestCount,
        maxGuests,
      },
      { status: 409 }
    );
  }

  await db.insert(schema.bookingGuests).values({
    bookingId: invite.booking.id,
    userId: session.user.id,
    inviteId: invite.id,
  });

  await createAccessPass({
    bookingId: invite.booking.id,
    userId: session.user.id,
    role: "guest",
  });

  return Response.json({ success: true, bookingId: invite.booking.id });
}
