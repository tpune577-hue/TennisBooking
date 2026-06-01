import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export type BookingGuestRow = {
  user: { lineUserId: string | null; name: string };
};

/** Returns [] if booking_guests table is not migrated yet. */
export async function loadBookingGuests(bookingId: string): Promise<BookingGuestRow[]> {
  try {
    const db = getDb();
    return await db.query.bookingGuests.findMany({
      where: eq(schema.bookingGuests.bookingId, bookingId),
      with: {
        user: { columns: { lineUserId: true, name: true } },
      },
    });
  } catch (err) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "booking_guests_unavailable",
        bookingId,
        error: String(err),
      })
    );
    return [];
  }
}
