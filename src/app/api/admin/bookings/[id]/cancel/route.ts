import { auth } from "@/lib/auth";
import { cancelBooking } from "@/lib/bookings/cancel-booking";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const bodySchema = z.object({
  refundCredits: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await cancelBooking({
      bookingId: id,
      cancelledByUserId: session.user.id,
      refundCredits: parsed.data.refundCredits,
      initiatedBy: "admin",
    });
    return Response.json({ success: true, ...result });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "NOT_FOUND") return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
    if (code === "ALREADY_CANCELLED") return Response.json({ error: "ยกเลิกไปแล้ว" }, { status: 400 });
    if (code === "INVALID_STATUS") return Response.json({ error: "ไม่สามารถยกเลิกได้" }, { status: 400 });
    console.error(JSON.stringify({ level: "error", msg: "admin_cancel_failed", id, error: String(err) }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
