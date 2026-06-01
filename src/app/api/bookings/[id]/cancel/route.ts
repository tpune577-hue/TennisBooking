import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { notifyBookingCancelled } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role ?? "customer";
  const isAdmin = ADMIN_ROLES.includes(role);

  try {
    const db = getDb();

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
      with: {
        court: { columns: { name: true } },
        user: { columns: { lineUserId: true } },
      },
    });

    if (!booking) return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
    if (!isAdmin && booking.userId !== userId)
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    if (booking.status === "cancelled")
      return Response.json({ error: "ยกเลิกไปแล้ว" }, { status: 400 });
    if (booking.status !== "confirmed")
      return Response.json({ error: "ไม่สามารถยกเลิกได้" }, { status: 400 });

    const now = new Date();
    const hoursUntilStart =
      (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const shouldRefund = hoursUntilStart >= 24;

    await db.transaction(async (tx) => {
      await tx
        .update(schema.bookings)
        .set({
          status: "cancelled",
          cancelledAt: now,
          cancelledBy: userId,
          creditRefunded: shouldRefund,
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, id));

      if (shouldRefund && booking.totalCreditCost > 0) {
        const [user] = await tx
          .select({ creditBalance: schema.users.creditBalance })
          .from(schema.users)
          .where(eq(schema.users.id, booking.userId));

        const balanceBefore = user.creditBalance;
        const balanceAfter = balanceBefore + booking.totalCreditCost;

        await tx
          .update(schema.users)
          .set({ creditBalance: balanceAfter, updatedAt: now })
          .where(eq(schema.users.id, booking.userId));

        await tx.insert(schema.creditTransactions).values({
          userId: booking.userId,
          type: "refund",
          amount: booking.totalCreditCost,
          balanceBefore,
          balanceAfter,
          bookingId: id,
          description: `คืนเครดิต ยกเลิกจอง ${booking.bookingRef}`,
        });
      }
    });

    // LINE notification
    if (booking.user.lineUserId) {
      await notifyBookingCancelled({
        lineUserId: booking.user.lineUserId,
        bookingRef: booking.bookingRef,
        courtName: booking.court.name,
        refunded: shouldRefund,
        creditRefunded: shouldRefund ? booking.totalCreditCost : 0,
      });
    }

    console.log(JSON.stringify({ level: "info", msg: "booking_cancelled", id, refunded: shouldRefund, ms: Date.now() - start }));
    return Response.json({ success: true, refunded: shouldRefund, creditRefunded: shouldRefund ? booking.totalCreditCost : 0 });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "cancel_failed", id, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
