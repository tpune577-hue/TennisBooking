import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq, ne, lt, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
  const url = new URL(req.url);
  const courtId = url.searchParams.get("courtId");
  const date = url.searchParams.get("date"); // YYYY-MM-DD

  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/bookings/availability", courtId, date }));

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!courtId || !date) {
    return Response.json({ error: "courtId and date are required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const db = getDb();

    const court = await db.query.courts.findFirst({
      where: and(eq(schema.courts.id, courtId), eq(schema.courts.isActive, true)),
      with: { pricing: true },
    });

    if (!court) {
      return Response.json({ error: "Court not found" }, { status: 404 });
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const existingBookings = await db
      .select({ startTime: schema.bookings.startTime, endTime: schema.bookings.endTime })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.courtId, courtId),
          ne(schema.bookings.status, "cancelled"),
          gt(schema.bookings.endTime, dayStart),
          lt(schema.bookings.startTime, dayEnd),
        )
      );

    const openHour = parseHour(court.openTime);
    const closeHour = parseHour(court.closeTime);
    const pricing = court.pricing;

    const slots = [];
    for (let hour = openHour; hour < closeHour; hour++) {
      const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00.000Z`);
      const slotEnd = new Date(`${date}T${String(hour + 1).padStart(2, "0")}:00:00.000Z`);

      const isBooked = existingBookings.some(
        (b) => b.startTime < slotEnd && b.endTime > slotStart
      );

      const peak = pricing ? isPeakHour(hour, pricing.peakStartTime, pricing.peakEndTime) : false;
      const pricePerHour = pricing
        ? peak
          ? pricing.peakPricePerHour
          : pricing.offPeakPricePerHour
        : 0;

      slots.push({ hour, available: !isBooked, isPeak: peak, pricePerHour });
    }

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/bookings/availability", ms: Date.now() - start }));
    return Response.json({ court, slots, date });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/bookings/availability", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
