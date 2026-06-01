import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, { label: string; sign: "+" | "-" }> = {
  topup:      { label: "เติมเครดิต",   sign: "+" },
  booking:    { label: "จองสนาม",      sign: "-" },
  refund:     { label: "คืนเครดิต",    sign: "+" },
  expired:    { label: "หมดอายุ",       sign: "-" },
  adjustment: { label: "ปรับยอด",      sign: "+" },
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function CreditsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  const [user, transactions] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { creditBalance: true },
    }),
    db.query.creditTransactions.findMany({
      where: eq(schema.creditTransactions.userId, userId),
      orderBy: [desc(schema.creditTransactions.createdAt)],
      limit: 50,
    }),
  ]);

  const totalTopup = transactions
    .filter((t) => t.type === "topup")
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "booking")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">เครดิตของฉัน</h1>
        <Link href="/dashboard/topup">
          <Button size="sm">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            เติมเครดิต
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">คงเหลือ</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{user?.creditBalance ?? 0}</div>
            <p className="text-xs text-muted-foreground">เครดิต</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เติมทั้งหมด</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{totalTopup}</div>
            <p className="text-xs text-muted-foreground">เครดิต</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ใช้ไปทั้งหมด</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{totalSpent}</div>
            <p className="text-xs text-muted-foreground">เครดิต</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">ประวัติธุรกรรม</h2>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              ยังไม่มีประวัติธุรกรรม
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => {
              const info = TYPE_LABELS[t.type] ?? { label: t.type, sign: "+" };
              const isPositive = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{info.label}</span>
                      <Badge variant="outline" className="text-xs">{t.type}</Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{t.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">คงเหลือ {t.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
