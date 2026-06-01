import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq, ne, lt, gt, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { notifyBookingConfirmed } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

const createBookingSchema = z.object({
  courtId: z.string().uuid(),
  coachId: z.string().uuid().nullable().optional(),
  type: z.enum(["court_only", "court_with_coach"]),
  startTime: z.string().datetime(), // ISO 8601
  endTime: z.string().datetime(),
});

function parseHour(timeStr: string): number {
  return parseInt(timeStr.split(":")[0], 10);
}

function isPeakHour(hour: number, peakStart: string, peakEnd: string): boolean {
  const ps = parseHour(peakStart);
  const pe = parseHour(peakEnd);
  return hour >= ps && hour < pe;
}

export async function GET(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/bookings" }));

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const userId = (session.user as { id: string }).id;

    const bookings = await db.query.bookings.findMany({
      where: eq(schema.bookings.userId, userId),
      orderBy: [desc(schema.bookings.startTime)],
      with: {
        court: { columns: { id: true, name: true, type: true } },
        coach: {
          with: {
            user: { columns: { name: true, avatarUrl: true } },
          },
        },
      },
      limit: 20,
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/bookings", ms: Date.now() - start }));
    return Response.json(bookings);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/bookings", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "POST /api/bookings" }));

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { courtId, coachId, type, startTime: startStr, endTime: endStr } = parsed.data;
    const startTime = new Date(startStr);
    const endTime = new Date(endStr);
    const userId = (session.user as { id: string }).id;

    if (startTime >= endTime) {
      return Response.json({ error: "endTime must be after startTime" }, { status: 400 });
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));

    if (durationHours < 1 || durationHours > 6) {
      return Response.json({ error: "Booking duration must be 1–6 hours" }, { status: 400 });
    }

    const db = getDb();

    // Check for conflicts
    const conflicts = await db
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.courtId, courtId),
          ne(schema.bookings.status, "cancelled"),
          lt(schema.bookings.startTime, endTime),
          gt(schema.bookings.endTime, startTime),
        )
      );

    if (conflicts.length > 0) {
      throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
    }

    // Get court pricing
    const court = await db.query.courts.findFirst({
      where: and(eq(schema.courts.id, courtId), eq(schema.courts.isActive, true)),
      with: { pricing: true },
    });

    if (!court) throw Object.assign(new Error("COURT_NOT_FOUND"), { code: "COURT_NOT_FOUND" });

    const pricing = court.pricing;
    if (!pricing) throw Object.assign(new Error("PRICING_NOT_CONFIGURED"), { code: "PRICING_NOT_CONFIGURED" });

    // Get user with tier for discount
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: { tier: true },
    });

    if (!user) throw Object.assign(new Error("USER_NOT_FOUND"), { code: "USER_NOT_FOUND" });

    const discountPercent = user.tier?.discountPercent ?? 0;
    const maxHoursPerBooking = user.tier?.maxHoursPerBooking ?? 3;

    if (durationHours > maxHoursPerBooking) {
      throw Object.assign(new Error(`MAX_HOURS_EXCEEDED:${maxHoursPerBooking}`), { code: "MAX_HOURS_EXCEEDED" });
    }

    // Calculate court cost hour by hour
    let courtCreditCost = 0;
    for (let h = 0; h < durationHours; h++) {
      const slotHour = startTime.getUTCHours() + h;
      const peak = isPeakHour(slotHour, pricing.peakStartTime, pricing.peakEndTime);
      const basePrice = peak ? pricing.peakPricePerHour : pricing.offPeakPricePerHour;
      courtCreditCost += Math.floor(basePrice * (1 - discountPercent / 100));
    }

    // Coach cost
    let coachCreditCost = 0;
    let resolvedCoachId: string | null = coachId ?? null;

    if (type === "court_with_coach" && resolvedCoachId) {
      const coach = await db.query.coachProfiles.findFirst({
        where: and(
          eq(schema.coachProfiles.id, resolvedCoachId),
          eq(schema.coachProfiles.isAvailable, true),
        ),
      });
      if (!coach) throw Object.assign(new Error("COACH_NOT_FOUND"), { code: "COACH_NOT_FOUND" });
      coachCreditCost = coach.pricePerHour * durationHours;
    } else if (type === "court_with_coach") {
      throw Object.assign(new Error("COACH_REQUIRED"), { code: "COACH_REQUIRED" });
    }

    const totalCreditCost = courtCreditCost + coachCreditCost;

    // Check user has enough credits
    if (user.creditBalance < totalCreditCost) {
      throw Object.assign(new Error("INSUFFICIENT_CREDITS"), { code: "INSUFFICIENT_CREDITS" });
    }

    // Generate booking reference
    const dateStr = startTime.toISOString().slice(0, 10).replace(/-/g, "");
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.bookings)
      .where(sql`booking_ref LIKE ${"BK-" + dateStr + "-%"}`);

    const seq = (countRow?.count ?? 0) + 1;
    const bookingRef = `BK-${dateStr}-${String(seq).padStart(3, "0")}`;

    // Insert booking
    const [booking] = await db
      .insert(schema.bookings)
      .values({
        bookingRef,
        userId,
        courtId,
        coachId: resolvedCoachId,
        type,
        status: "confirmed",
        startTime,
        endTime,
        durationHours,
        courtCreditCost,
        coachCreditCost,
        totalCreditCost,
      })
      .returning();

    // Deduct credits
    const balanceBefore = user.creditBalance;
    const balanceAfter = balanceBefore - totalCreditCost;

    await db
      .update(schema.users)
      .set({ creditBalance: balanceAfter, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    // Credit transaction record
    await db.insert(schema.creditTransactions).values({
      userId,
      type: "booking",
      amount: -totalCreditCost,
      balanceBefore,
      balanceAfter,
      bookingId: booking.id,
      description: `จองสนาม ${bookingRef}`,
    });

    // Fetch user lineUserId for notification
    const userForNotif = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { lineUserId: true },
    });

    const result = { booking, balanceAfter, lineUserId: userForNotif?.lineUserId ?? null };

    // LINE notification (fire-and-forget)
    if (result.lineUserId) {
      notifyBookingConfirmed({
        lineUserId: result.lineUserId,
        bookingRef: result.booking.bookingRef,
        courtName: parsed.data.courtId, // court name lookup skipped for perf
        date: startTime.toISOString().slice(0, 10),
        startHour: startTime.getUTCHours(),
        endHour: endTime.getUTCHours(),
        totalCost: result.booking.totalCreditCost,
      });
    }

    console.log(JSON.stringify({ level: "info", msg: "done", route: "POST /api/bookings", ref: result.booking.bookingRef, ms: Date.now() - start }));
    return Response.json({ booking: result.booking, newCreditBalance: result.balanceAfter }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const knownErrors: Record<string, [string, number]> = {
      SLOT_TAKEN: ["เวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น", 409],
      COURT_NOT_FOUND: ["ไม่พบสนาม", 404],
      PRICING_NOT_CONFIGURED: ["ยังไม่มีการตั้งราคาสนามนี้", 422],
      COACH_NOT_FOUND: ["ไม่พบข้อมูลโค้ช", 404],
      COACH_REQUIRED: ["กรุณาเลือกโค้ช", 400],
      INSUFFICIENT_CREDITS: ["เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อนจอง", 402],
    };

    if (code?.startsWith("MAX_HOURS_EXCEEDED")) {
      const max = code.split(":")[1];
      return Response.json({ error: `จองได้สูงสุด ${max} ชั่วโมงต่อครั้ง` }, { status: 400 });
    }

    if (code && knownErrors[code]) {
      const [msg, status] = knownErrors[code];
      return Response.json({ error: msg }, { status });
    }

    console.error(JSON.stringify({ level: "error", msg: "failed", route: "POST /api/bookings", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
