import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createPromptPaySource, createCharge, CREDIT_PACKAGES } from "@/lib/omise";

export const dynamic = "force-dynamic";

const createPaymentSchema = z
  .object({
    packageIndex: z.number().int().min(0).max(3).optional(),
    dealOfferId: z.string().uuid().optional(),
    method: z.enum(["promptpay", "credit_card"]),
    cardToken: z.string().optional(),
  })
  .refine((d) => (d.packageIndex !== undefined) !== (d.dealOfferId !== undefined), {
    message: "ระบุ packageIndex หรือ dealOfferId อย่างใดอย่างหนึ่ง",
  });

export async function POST(req: Request) {
  const start = Date.now();
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const { packageIndex, dealOfferId, method, cardToken } = parsed.data;
    const db = getDb();

    let amountSatang: number;
    let creditAmount: number;
    let description: string;
    let paymentDealOfferId: string | undefined;

    if (dealOfferId) {
      const offer = await db.query.dealOffers.findFirst({
        where: eq(schema.dealOffers.id, dealOfferId),
      });
      if (!offer || offer.userId !== userId) {
        return Response.json({ error: "ไม่พบ Deal" }, { status: 404 });
      }
      if (offer.status !== "non_paid") {
        return Response.json({ error: "Deal นี้ไม่สามารถชำระเงินได้" }, { status: 400 });
      }
      if (offer.expiresAt <= new Date()) {
        await db
          .update(schema.dealOffers)
          .set({ status: "expired" })
          .where(eq(schema.dealOffers.id, dealOfferId));
        return Response.json({ error: "Deal หมดอายุแล้ว" }, { status: 400 });
      }
      amountSatang = offer.priceThb * 100;
      creditAmount = offer.creditAmount;
      description = `Deal เติมเครดิต ${offer.creditAmount} เครดิต (${offer.priceThb.toLocaleString()} บาท)`;
      paymentDealOfferId = offer.id;
    } else {
      const pkg = CREDIT_PACKAGES[packageIndex!];
      if (!pkg) return Response.json({ error: "Invalid package" }, { status: 400 });
      amountSatang = pkg.thb * 100;
      creditAmount = pkg.credits;
      description = `เติมเครดิต ${pkg.credits} เครดิต (${pkg.label})`;
    }

    const [payment] = await db
      .insert(schema.payments)
      .values({
        userId,
        amount: amountSatang,
        creditAmount,
        status: "pending",
        method,
        description,
        dealOfferId: paymentDealOfferId,
      })
      .returning();

    let chargeResult: Awaited<ReturnType<typeof createCharge>>;

    if (method === "promptpay") {
      const source = await createPromptPaySource(amountSatang);
      chargeResult = await createCharge({
        amount: amountSatang,
        sourceId: source.id,
        description: `Tennis Club — ${description}`,
        metadata: { paymentId: payment.id, userId },
      });
    } else {
      if (!cardToken) return Response.json({ error: "cardToken required for credit_card" }, { status: 400 });
      chargeResult = await createCharge({
        amount: amountSatang,
        cardToken,
        description: `Tennis Club — ${description}`,
        metadata: { paymentId: payment.id, userId },
      });
    }

    // Save charge ID
    await db
      .update(schema.payments)
      .set({ omiseChargeId: chargeResult.id, updatedAt: new Date() })
      .where(eq(schema.payments.id, payment.id));

    // For card payments that succeed immediately
    if (method === "credit_card" && chargeResult.status === "successful") {
      await fulfillPayment(db, payment.id, userId, creditAmount);
    }

    return Response.json({
      paymentId: payment.id,
      chargeId: chargeResult.id,
      status: chargeResult.status,
      method,
      qrImageUrl: method === "promptpay"
        ? chargeResult.source?.scannable_code?.image?.download_uri ?? null
        : null,
    }, { status: 201 });

  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "payment_create_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "เกิดข้อผิดพลาดในการสร้าง payment กรุณาลองใหม่" }, { status: 500 });
  }
}

export async function fulfillPayment(
  db: ReturnType<typeof getDb>,
  paymentId: string,
  userId: string,
  creditAmount: number,
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Atomic idempotency: only proceed if payment is still pending.
  // Single-row UPDATE WHERE status='pending' is atomic in Postgres —
  // if two callers race, only one gets a returned row.
  const claimed = await db
    .update(schema.payments)
    .set({ status: "paid", paidAt: now, updatedAt: now })
    .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.status, "pending")))
    .returning({ id: schema.payments.id });

  if (claimed.length === 0) return; // already fulfilled by another caller

  // Get user balance
  const [user] = await db
    .select({ creditBalance: schema.users.creditBalance })
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  const balanceBefore = user.creditBalance;
  const balanceAfter = balanceBefore + creditAmount;

  // Add credits
  await db
    .update(schema.users)
    .set({ creditBalance: balanceAfter, updatedAt: now })
    .where(eq(schema.users.id, userId));

  // Credit transaction record
  await db.insert(schema.creditTransactions).values({
    userId,
    type: "topup",
    amount: creditAmount,
    balanceBefore,
    balanceAfter,
    paymentId,
    expiresAt,
    description: `เติมเครดิต ${creditAmount} เครดิต`,
  });

  // Credit batch for expiry tracking
  await db.insert(schema.creditBatches).values({
    userId,
    originalAmount: creditAmount,
    remainingAmount: creditAmount,
    expiresAt,
    paymentId,
  });

  const [payment] = await db
    .select({ dealOfferId: schema.payments.dealOfferId })
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId));

  if (payment?.dealOfferId) {
    await db
      .update(schema.dealOffers)
      .set({ status: "paid", paidAt: now })
      .where(
        and(
          eq(schema.dealOffers.id, payment.dealOfferId),
          eq(schema.dealOffers.status, "non_paid")
        )
      );
  }
}
