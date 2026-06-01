import { getDb, schema } from "@/db";
import { eq, lte, gt, and } from "drizzle-orm";
import { notifyCreditExpiringSoon } from "@/lib/notifications/line";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/cron/expire-credits" }));

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();

    // 1. Find and expire credit batches past expiry date
    const expiredBatches = await db.query.creditBatches.findMany({
      where: and(
        lte(schema.creditBatches.expiresAt, now),
        gt(schema.creditBatches.remainingAmount, 0)
      ),
      with: {
        user: { columns: { id: true, creditBalance: true } },
      },
    });

    let expiredCount = 0;
    for (const batch of expiredBatches) {
      await db.transaction(async (tx) => {
        const deduct = batch.remainingAmount;
        const balanceBefore = batch.user.creditBalance;
        const balanceAfter = Math.max(0, balanceBefore - deduct);

        await tx
          .update(schema.users)
          .set({ creditBalance: balanceAfter, updatedAt: now })
          .where(eq(schema.users.id, batch.userId));

        await tx.insert(schema.creditTransactions).values({
          userId: batch.userId,
          type: "expired",
          amount: -deduct,
          balanceBefore,
          balanceAfter,
          description: `เครดิตหมดอายุ ${deduct} เครดิต`,
        });

        await tx
          .update(schema.creditBatches)
          .set({ remainingAmount: 0 })
          .where(eq(schema.creditBatches.id, batch.id));
      });

      expiredCount++;
    }

    // 2. Notify users with credits expiring in 7 days
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringBatches = await db.query.creditBatches.findMany({
      where: and(
        lte(schema.creditBatches.expiresAt, sevenDaysLater),
        gt(schema.creditBatches.expiresAt, now),
        gt(schema.creditBatches.remainingAmount, 0)
      ),
      with: {
        user: { columns: { lineUserId: true } },
      },
    });

    const notified = new Set<string>();
    for (const batch of expiringBatches) {
      if (!batch.user.lineUserId || notified.has(batch.userId)) continue;
      notified.add(batch.userId);

      const daysLeft = Math.ceil(
        (batch.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      notifyCreditExpiringSoon({
        lineUserId: batch.user.lineUserId,
        amount: batch.remainingAmount,
        daysLeft,
        expiresAt: batch.expiresAt.toISOString().slice(0, 10),
      });
    }

    console.log(JSON.stringify({
      level: "info",
      msg: "done",
      route: "GET /api/cron/expire-credits",
      expired: expiredCount,
      notified: notified.size,
      ms: Date.now() - start,
    }));

    return Response.json({ ok: true, expired: expiredCount, notified: notified.size });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "cron_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
