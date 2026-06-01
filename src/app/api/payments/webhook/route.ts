import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fulfillPayment } from "../route";
import { notifyTopupSuccess } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "POST /api/payments/webhook" }));

  try {
    const event = await req.json() as {
      key: string;
      data: { id: string; status: string; metadata?: Record<string, string> };
    };

    if (event.key !== "charge.complete") {
      return Response.json({ ok: true });
    }

    const charge = event.data;
    if (charge.status !== "successful") {
      return Response.json({ ok: true });
    }

    const paymentId = charge.metadata?.paymentId;
    if (!paymentId) {
      console.error(JSON.stringify({ level: "error", msg: "webhook_no_payment_id", chargeId: charge.id }));
      return Response.json({ ok: true });
    }

    const db = getDb();
    const payment = await db.query.payments.findFirst({
      where: eq(schema.payments.id, paymentId),
    });

    if (!payment || payment.status === "paid") {
      return Response.json({ ok: true });
    }

    await fulfillPayment(db, payment.id, payment.userId, payment.creditAmount, charge.id);

    // LINE notification
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, payment.userId),
      columns: { lineUserId: true, creditBalance: true },
    });
    if (user?.lineUserId) {
      notifyTopupSuccess({
        lineUserId: user.lineUserId,
        creditAmount: payment.creditAmount,
        newBalance: user.creditBalance,
      });
    }

    console.log(JSON.stringify({ level: "info", msg: "webhook_fulfilled", paymentId, credits: payment.creditAmount, ms: Date.now() - start }));
    return Response.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "webhook_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
