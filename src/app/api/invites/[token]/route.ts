import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = getDb();

  const invite = await db.query.bookingInvites.findFirst({
    where: eq(schema.bookingInvites.token, token),
    with: {
      booking: {
        with: {
          court: { columns: { name: true } },
          user: { columns: { name: true } },
        },
      },
    },
  });

  if (!invite || invite.booking.status !== "confirmed") {
    return Response.json({ error: "ไม่พบคำเชิญหรือการจองถูกยกเลิกแล้ว" }, { status: 404 });
  }

  return Response.json({
    token: invite.token,
    gameMode: invite.gameMode,
    booking: {
      ref: invite.booking.bookingRef,
      courtName: invite.booking.court.name,
      hostName: invite.booking.user.name,
      startTime: invite.booking.startTime,
      endTime: invite.booking.endTime,
    },
  });
}
