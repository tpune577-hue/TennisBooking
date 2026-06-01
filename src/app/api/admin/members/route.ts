import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

export async function GET(req: Request) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "GET /api/admin/members" }));

  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const db = getDb();

    const members = await db.query.users.findMany({
      where: q
        ? or(
            ilike(schema.users.name, `%${q}%`),
            ilike(schema.users.email, `%${q}%`),
            ilike(schema.users.phone, `%${q}%`)
          )
        : undefined,
      orderBy: [desc(schema.users.createdAt)],
      limit: 100,
      with: {
        tier: { columns: { name: true } },
      },
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        creditBalance: true,
        isActive: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    console.log(JSON.stringify({ level: "info", msg: "done", route: "GET /api/admin/members", count: members.length, ms: Date.now() - start }));
    return Response.json(members);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "GET /api/admin/members", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

const adjustCreditSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int(),
  description: z.string().min(1),
});

export async function POST(req: Request) {
  const start = Date.now();
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = adjustCreditSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const { userId, amount, description } = parsed.data;
    const db = getDb();

    await db.transaction(async (tx) => {
      const [user] = await tx
        .select({ creditBalance: schema.users.creditBalance })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) throw new Error("USER_NOT_FOUND");

      const balanceBefore = user.creditBalance;
      const balanceAfter = Math.max(0, balanceBefore + amount);

      await tx.update(schema.users)
        .set({ creditBalance: balanceAfter, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));

      await tx.insert(schema.creditTransactions).values({
        userId,
        type: "adjustment",
        amount,
        balanceBefore,
        balanceAfter,
        description,
      });
    });

    console.log(JSON.stringify({ level: "info", msg: "credit_adjusted", userId, amount, ms: Date.now() - start }));
    return Response.json({ success: true });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "adjust_credit_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
