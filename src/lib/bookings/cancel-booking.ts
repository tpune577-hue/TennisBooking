import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { loadBookingGuests } from "@/lib/bookings/load-booking-guests";
import {
  notifyBookingCancelled,
  notifyBookingCancelledGuest,
  notifyBookingCancelledOwner,
} from "@/lib/notifications/line";

export async function cancelBooking(opts: {
  bookingId: string;
  cancelledByUserId: string;
  refundCredits: boolean;
  /** member = self-cancel copy; admin = club cancel + notify guests */
  initiatedBy: "member" | "admin";
}) {
  const db = getDb();
  const now = new Date();

  const booking = await db.query.bookings.findFirst({
    where: eq(schema.bookings.id, opts.bookingId),
    with: {
      court: { columns: { name: true } },
      user: { columns: { lineUserId: true, name: true } },
    },
  });

  if (!booking) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
  if (booking.status === "cancelled")
    throw Object.assign(new Error("ALREADY_CANCELLED"), { code: "ALREADY_CANCELLED" });
  if (booking.status !== "confirmed")
    throw Object.assign(new Error("INVALID_STATUS"), { code: "INVALID_STATUS" });

  const shouldRefund = opts.refundCredits && booking.totalCreditCost > 0;

  await db
    .update(schema.bookings)
    .set({
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: opts.cancelledByUserId,
      creditRefunded: shouldRefund,
      updatedAt: now,
    })
    .where(eq(schema.bookings.id, opts.bookingId));

  if (shouldRefund) {
    const [user] = await db
      .select({ creditBalance: schema.users.creditBalance })
      .from(schema.users)
      .where(eq(schema.users.id, booking.userId));

    const balanceBefore = user.creditBalance;
    const balanceAfter = balanceBefore + booking.totalCreditCost;

    await db
      .update(schema.users)
      .set({ creditBalance: balanceAfter, updatedAt: now })
      .where(eq(schema.users.id, booking.userId));

    await db.insert(schema.creditTransactions).values({
      userId: booking.userId,
      type: "refund",
      amount: booking.totalCreditCost,
      balanceBefore,
      balanceAfter,
      bookingId: opts.bookingId,
      description: `คืนเครดิต ยกเลิกจอง ${booking.bookingRef}`,
    });
  }

  const slotText = { startTime: booking.startTime, endTime: booking.endTime };

  if (booking.user.lineUserId) {
    const ownerPayload = {
      lineUserId: booking.user.lineUserId,
      bookingRef: booking.bookingRef,
      courtName: booking.court.name,
      ...slotText,
      refunded: shouldRefund,
      creditRefunded: shouldRefund ? booking.totalCreditCost : 0,
    };
    if (opts.initiatedBy === "admin") {
      await notifyBookingCancelledOwner(ownerPayload);
    } else {
      await notifyBookingCancelled(ownerPayload);
    }
  }

  const notifiedGuests = new Set<string>();
  if (opts.initiatedBy !== "admin") {
    return {
      refunded: shouldRefund,
      creditRefunded: shouldRefund ? booking.totalCreditCost : 0,
      guestsNotified: 0,
    };
  }

  const guests = await loadBookingGuests(opts.bookingId);

  for (const guest of guests) {
    const lineUserId = guest.user.lineUserId;
    if (!lineUserId || notifiedGuests.has(lineUserId)) continue;
    if (lineUserId === booking.user.lineUserId) continue;
    notifiedGuests.add(lineUserId);
    await notifyBookingCancelledGuest({
      lineUserId,
      bookingRef: booking.bookingRef,
      courtName: booking.court.name,
      ...slotText,
      hostName: booking.user.name,
    });
  }

  return {
    refunded: shouldRefund,
    creditRefunded: shouldRefund ? booking.totalCreditCost : 0,
    guestsNotified: notifiedGuests.size,
  };
}
