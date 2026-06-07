import { getDb, schema } from "@/db";
import { and, eq, lte } from "drizzle-orm";

export async function expireDueDealOffers(now = new Date()): Promise<number> {
  const db = getDb();
  const expired = await db
    .update(schema.dealOffers)
    .set({ status: "expired" })
    .where(
      and(
        eq(schema.dealOffers.status, "non_paid"),
        lte(schema.dealOffers.expiresAt, now)
      )
    )
    .returning({ id: schema.dealOffers.id });

  return expired.length;
}

export async function expireDealOfferIfDue(
  offerId: string,
  now = new Date()
): Promise<void> {
  const db = getDb();
  await db
    .update(schema.dealOffers)
    .set({ status: "expired" })
    .where(
      and(
        eq(schema.dealOffers.id, offerId),
        eq(schema.dealOffers.status, "non_paid"),
        lte(schema.dealOffers.expiresAt, now)
      )
    );
}
