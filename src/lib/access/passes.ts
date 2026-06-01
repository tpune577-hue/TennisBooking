import { randomBytes } from "crypto";
import { getDb, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import type { AccessPassRole } from "./types";

function newToken(): string {
  return randomBytes(24).toString("hex");
}

export function accessQrPayload(token: string): string {
  return `gtc-access:${token}`;
}

export async function createAccessPass(opts: {
  bookingId: string;
  userId: string;
  role: AccessPassRole;
}) {
  const db = getDb();
  const existing = await db.query.bookingAccessPasses.findFirst({
    where: and(
      eq(schema.bookingAccessPasses.bookingId, opts.bookingId),
      eq(schema.bookingAccessPasses.userId, opts.userId)
    ),
  });

  if (existing && existing.status === "active") return existing;

  if (existing) {
    const [revived] = await db
      .update(schema.bookingAccessPasses)
      .set({
        status: "active",
        presence: "outside",
        role: opts.role,
        token: newToken(),
        revokedAt: null,
        revokeReason: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.bookingAccessPasses.id, existing.id))
      .returning();
    return revived;
  }

  const [pass] = await db
    .insert(schema.bookingAccessPasses)
    .values({
      bookingId: opts.bookingId,
      userId: opts.userId,
      role: opts.role,
      token: newToken(),
    })
    .returning();

  return pass;
}

export async function createPassesForConfirmedBooking(bookingId: string) {
  const db = getDb();
  const booking = await db.query.bookings.findFirst({
    where: eq(schema.bookings.id, bookingId),
    columns: { id: true, userId: true, type: true, coachId: true, status: true },
  });

  if (!booking || booking.status !== "confirmed") return;

  await createAccessPass({
    bookingId,
    userId: booking.userId,
    role: "host",
  });

  if (booking.type === "court_with_coach" && booking.coachId) {
    const coach = await db.query.coachProfiles.findFirst({
      where: eq(schema.coachProfiles.id, booking.coachId),
      with: { user: { columns: { id: true, role: true } } },
    });
    if (coach?.user.role === "coach_freelance") {
      await createAccessPass({
        bookingId,
        userId: coach.user.id,
        role: "coach",
      });
    }
  }
}

export async function revokeAllPassesForBooking(
  bookingId: string,
  reason: string
) {
  const db = getDb();
  const now = new Date();
  await db
    .update(schema.bookingAccessPasses)
    .set({
      status: "revoked",
      presence: "outside",
      revokedAt: now,
      revokeReason: reason,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.bookingAccessPasses.bookingId, bookingId),
        eq(schema.bookingAccessPasses.status, "active")
      )
    );
}

export async function revokeGuestPass(opts: {
  bookingId: string;
  userId: string;
  reason: string;
}) {
  const db = getDb();
  const now = new Date();
  await db
    .update(schema.bookingAccessPasses)
    .set({
      status: "revoked",
      presence: "outside",
      revokedAt: now,
      revokeReason: opts.reason,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.bookingAccessPasses.bookingId, opts.bookingId),
        eq(schema.bookingAccessPasses.userId, opts.userId),
        eq(schema.bookingAccessPasses.role, "guest")
      )
    );
}

export async function countBookingGuests(bookingId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.bookingGuests)
    .where(eq(schema.bookingGuests.bookingId, bookingId));
  return row?.count ?? 0;
}
