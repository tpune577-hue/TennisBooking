import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { retrieveCharge } from "@/lib/omise";
import { fulfillPayment } from "../../route";
import { notifyTopupSuccess } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id } = await params;
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/payments/[id]/status", id }));

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  try {
    const payment = await db.query.payments.findFirst({
      where: and(eq(schema.payments.id, id), eq(schema.payments.userId, userId)),
    });

    if (!payment) return Response.json({ error: "Not found" }, { status: 404 });

    if (payment.status === "paid" || payment.status === "failed") {
      console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/payments/[id]/status", status: payment.status, ms: Date.now() - start }));
      return Response.json({ status: payment.status });
    }

    if (!payment.omiseChargeId) {
      return Response.json({ status: payment.status });
    }

    const charge = await retrieveCharge(payment.omiseChargeId);

    if (charge.status === "successful") {
      await fulfillPayment(db, payment.id, userId, payment.creditAmount, charge.id);

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { lineUserId: true, creditBalance: true },
      });
      if (user?.lineUserId) {
        notifyTopupSuccess({
          lineUserId: user.lineUserId,
          creditAmount: payment.creditAmount,
          newBalance: user.creditBalance,
        });
      }

      console.log(JSON.stringify({ level: "info", msg: "payment_fulfilled", id, credits: payment.creditAmount, ms: Date.now() - start }));
      return Response.json({ status: "paid" });
    }

    if (charge.status === "failed" || charge.status === "expired") {
      await db
        .update(schema.payments)
        .set({
          status: "failed",
          failedAt: new Date(),
          failureMessage: charge.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.id, payment.id));
      return Response.json({ status: "failed" });
    }

    return Response.json({ status: "pending" });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "payment_status_failed", id, error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
