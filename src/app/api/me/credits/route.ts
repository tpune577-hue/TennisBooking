import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [user, transactions] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
      columns: { creditBalance: true },
    }),
    db.query.creditTransactions.findMany({
      where: eq(schema.creditTransactions.userId, session.user.id),
      orderBy: [desc(schema.creditTransactions.createdAt)],
      limit: 50,
    }),
  ]);

  if (!user) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    creditBalance: user.creditBalance,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
