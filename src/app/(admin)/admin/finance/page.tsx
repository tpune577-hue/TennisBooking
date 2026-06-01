import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { eq, gte, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, CreditCard, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const db = getDb();
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [topupThisMonth, bookingsThisMonth, totalCreditsInSystem, totalPaidPayments] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::int` })
      .from(schema.creditTransactions)
      .where(
        sql`type = 'topup' AND created_at >= ${thisMonth}`
      ),
    db
      .select({ total: sql<number>`coalesce(sum(abs(amount)), 0)::int` })
      .from(schema.creditTransactions)
      .where(
        sql`type = 'booking' AND created_at >= ${thisMonth}`
      ),
    db
      .select({ total: sql<number>`coalesce(sum(credit_balance), 0)::int` })
      .from(schema.users),
    db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::int` })
      .from(schema.payments)
      .where(eq(schema.payments.status, "paid")),
  ]);

  const stats = [
    {
      title: "เครดิตเติมเดือนนี้",
      value: topupThisMonth[0].total.toLocaleString(),
      icon: TrendingUp,
      unit: "เครดิต",
      iconBg: "bg-[color:var(--chart-2)]/10",
      iconColor: "text-[color:var(--chart-2)]",
    },
    {
      title: "เครดิตที่ใช้เดือนนี้",
      value: bookingsThisMonth[0].total.toLocaleString(),
      icon: CreditCard,
      unit: "เครดิต",
      iconBg: "bg-[color:var(--chart-4)]/10",
      iconColor: "text-[color:var(--chart-4)]",
    },
    {
      title: "เครดิตรวมในระบบ",
      value: totalCreditsInSystem[0].total.toLocaleString(),
      icon: Wallet,
      unit: "เครดิต",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "ยอดชำระเงินทั้งหมด",
      value: ((totalPaidPayments[0].total) / 100).toLocaleString(),
      icon: BarChart3,
      unit: "บาท",
      iconBg: "bg-[color:var(--chart-3)]/10",
      iconColor: "text-[color:var(--chart-3)]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">การเงิน</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมรายรับและเครดิตในระบบ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg}`}>
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tabular-nums ${s.iconColor}`}>{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.unit}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">กราฟรายรับรายเดือนอยู่ระหว่างพัฒนา</p>
      </div>
    </div>
  );
}
