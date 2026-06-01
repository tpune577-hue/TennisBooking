import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createPromptPaySource, createCharge, CREDIT_PACKAGES } from "@/lib/omise";

export const dynamic = "force-dynamic";

const createPaymentSchema = z.object({
  packageIndex: z.number().int().min(0).max(3),
  method: z.enum(["promptpay", "credit_card"]),
  cardToken: z.string().optional(),
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

    const { packageIndex, method, cardToken } = parsed.data;
    const pkg = CREDIT_PACKAGES[packageIndex];
    if (!pkg) return Response.json({ error: "Invalid package" }, { status: 400 });

    const amountSatang = pkg.thb * 100;
    const db = getDb();

    // Insert pending payment
    const [payment] = await db
      .insert(schema.payments)
      .values({
        userId,
        amount: amountSatang,
        creditAmount: pkg.credits,
        status: "pending",
        method,
        description: `เติมเครดิต ${pkg.credits} เครดิต (${pkg.label})`,
      })
      .returning();

    let chargeResult: Awaited<ReturnType<typeof createCharge>>;

    if (method === "promptpay") {
      const source = await createPromptPaySource(amountSatang);
      chargeResult = await createCharge({
        amount: amountSatang,
        sourceId: source.id,
        description: `Tennis Club — ${pkg.label} (${pkg.credits} credits)`,
        metadata: { paymentId: payment.id, userId },
      });
    } else {
      if (!cardToken) return Response.json({ error: "cardToken required for credit_card" }, { status: 400 });
      chargeResult = await createCharge({
        amount: amountSatang,
        cardToken,
        description: `Tennis Club — ${pkg.label} (${pkg.credits} credits)`,
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
      await fulfillPayment(db, payment.id, userId, pkg.credits, chargeResult.id);
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
  chargeId: string,
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.transaction(async (tx) => {
    // Mark payment as paid
    await tx
      .update(schema.payments)
      .set({ status: "paid", paidAt: now, updatedAt: now })
      .where(eq(schema.payments.id, paymentId));

    // Get user balance
    const [user] = await tx
      .select({ creditBalance: schema.users.creditBalance })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    const balanceBefore = user.creditBalance;
    const balanceAfter = balanceBefore + creditAmount;

    // Add credits
    await tx
      .update(schema.users)
      .set({ creditBalance: balanceAfter, updatedAt: now })
      .where(eq(schema.users.id, userId));

    // Credit transaction record
    await tx.insert(schema.creditTransactions).values({
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
    await tx.insert(schema.creditBatches).values({
      userId,
      originalAmount: creditAmount,
      remainingAmount: creditAmount,
      expiresAt,
      paymentId,
    });
  });
}
