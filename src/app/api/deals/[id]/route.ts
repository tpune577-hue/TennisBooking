import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { dealBonusPercent } from "@/lib/deals/bonus-percent";
import { expireDealOfferIfDue } from "@/lib/deals/expire-offers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    await expireDealOfferIfDue(id);

    const db = getDb();
    const offer = await db.query.dealOffers.findFirst({
      where: and(eq(schema.dealOffers.id, id), eq(schema.dealOffers.userId, userId)),
    });

    if (!offer) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({
      id: offer.id,
      priceThb: offer.priceThb,
      creditAmount: offer.creditAmount,
      bonusPercent: dealBonusPercent(offer.priceThb, offer.creditAmount),
      expiresAt: offer.expiresAt.toISOString(),
      status: offer.status,
      canPay: offer.status === "non_paid",
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "deal_get_failed", id, error: String(err) }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
