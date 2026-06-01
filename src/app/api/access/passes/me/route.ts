import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getClubAccessSettings } from "@/lib/access/settings";
import { getAccessWindow, formatAccessWindowTh } from "@/lib/access/window";
import { accessQrPayload, createAccessPass, createPassesForConfirmedBooking } from "@/lib/access/passes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const bookingId = new URL(req.url).searchParams.get("bookingId");
  if (!bookingId) {
    return Response.json({ error: "bookingId required" }, { status: 400 });
  }

  const db = getDb();
  const settings = await getClubAccessSettings();

  const booking = await db.query.bookings.findFirst({
    where: eq(schema.bookings.id, bookingId),
    columns: { id: true, userId: true, status: true, type: true, coachId: true },
  });

  if (!booking || booking.status !== "confirmed") {
    return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
  }

  let pass = await db.query.bookingAccessPasses.findFirst({
    where: and(
      eq(schema.bookingAccessPasses.bookingId, bookingId),
      eq(schema.bookingAccessPasses.userId, userId)
    ),
    with: {
      booking: {
        with: { court: { columns: { name: true } } },
      },
    },
  });

  if (!pass) {
    if (booking.userId === userId) {
      await createPassesForConfirmedBooking(bookingId);
    } else {
      const guest = await db.query.bookingGuests.findFirst({
        where: and(
          eq(schema.bookingGuests.bookingId, bookingId),
          eq(schema.bookingGuests.userId, userId)
        ),
      });
      if (guest) {
        await createAccessPass({ bookingId, userId, role: "guest" });
      } else if (booking.type === "court_with_coach" && booking.coachId) {
        const coach = await db.query.coachProfiles.findFirst({
          where: eq(schema.coachProfiles.id, booking.coachId),
          with: { user: { columns: { id: true, role: true } } },
        });
        if (coach?.user.id === userId && coach.user.role === "coach_freelance") {
          await createAccessPass({ bookingId, userId, role: "coach" });
        }
      }
    }

    pass = await db.query.bookingAccessPasses.findFirst({
      where: and(
        eq(schema.bookingAccessPasses.bookingId, bookingId),
        eq(schema.bookingAccessPasses.userId, userId)
      ),
      with: {
        booking: {
          with: { court: { columns: { name: true } } },
        },
      },
    });
  }

  if (!pass) {
    return Response.json({ error: "ไม่พบ QR สำหรับการจองนี้" }, { status: 404 });
  }

  const window = getAccessWindow(pass.booking, settings);

  return Response.json({
    pass: {
      id: pass.id,
      role: pass.role,
      status: pass.status,
      presence: pass.presence,
      qrPayload: accessQrPayload(pass.token),
    },
    booking: {
      id: pass.booking.id,
      ref: pass.booking.bookingRef,
      courtName: pass.booking.court.name,
      status: pass.booking.status,
      startTime: pass.booking.startTime,
      endTime: pass.booking.endTime,
    },
    window: {
      validFrom: window.validFrom.toISOString(),
      validUntil: window.validUntil.toISOString(),
      phase: window.phase,
      label: formatAccessWindowTh(window),
    },
    settings: {
      enabled: settings.enabled,
    },
  });
}
