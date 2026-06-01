import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cancelBooking } from "@/lib/bookings/cancel-booking";

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
      columns: { userId: true, status: true, startTime: true },
    });

    if (!booking) return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
    if (!isAdmin && booking.userId !== userId)
      return Response.json({ error: "Unauthorized" }, { status: 403 });

    const now = new Date();
    const hoursUntilStart =
      (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const refundCredits = hoursUntilStart >= 24;

    const result = await cancelBooking({
      bookingId: id,
      cancelledByUserId: userId,
      refundCredits,
      initiatedBy: isAdmin ? "admin" : "member",
    });

    console.log(JSON.stringify({ level: "info", msg: "booking_cancelled", id, refunded: result.refunded, ms: Date.now() - start }));
    return Response.json({ success: true, ...result });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "ALREADY_CANCELLED") return Response.json({ error: "ยกเลิกไปแล้ว" }, { status: 400 });
    if (code === "INVALID_STATUS") return Response.json({ error: "ไม่สามารถยกเลิกได้" }, { status: 400 });
    console.error(JSON.stringify({ level: "error", msg: "cancel_failed", id, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
