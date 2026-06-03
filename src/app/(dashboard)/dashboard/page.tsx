import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { eq, and, gte, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Wallet, Clock, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTime(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const role = (session.user as { role?: string }).role ?? "customer";
  if (role === "super_admin" || role === "staff") redirect("/admin");

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  const [user, upcomingBookings] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { creditBalance: true, name: true },
      with: { tier: { columns: { name: true, discountPercent: true } } },
    }),
    db.query.bookings.findMany({
      where: and(
        eq(schema.bookings.userId, userId),
        eq(schema.bookings.status, "confirmed"),
        gte(schema.bookings.startTime, new Date())
      ),
      orderBy: [schema.bookings.startTime],
      limit: 3,
      with: {
        court: { columns: { name: true, type: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          สวัสดี, {session.user.name} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.tier ? (
            <span>
              สมาชิกระดับ <span className="text-primary font-medium">{user.tier.name}</span>
              {user.tier.discountPercent > 0 && ` · ส่วนลด ${user.tier.discountPercent}%`}
            </span>
          ) : (
            "ยินดีต้อนรับสู่ Tennis Club CRM"
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เครดิตคงเหลือ</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{user?.creditBalance ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">เครดิต</p>
            <Link href="/dashboard/topup">
              <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
                + เติมเครดิต
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">การจองที่กำลังจะมาถึง</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">รายการ</p>
            <Link href="/dashboard/bookings">
              <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
                ดูทั้งหมด
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">จองสนาม</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-1 mb-3">จองคอร์ตด้วยเครดิตสมาชิก</p>
            <Link href="/liff/book">
              <Button size="sm" className="w-full text-xs">
                จองสนาม
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">การจองที่กำลังจะมาถึง</h2>
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.court.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.startTime)} · {formatTime(b.startTime.getUTCHours())}–{formatTime(b.endTime.getUTCHours())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{b.totalCreditCost} เครดิต</Badge>
                  <Badge
                    variant={b.type === "court_with_coach" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {b.type === "court_with_coach" ? "มีโค้ช" : "สนามอย่างเดียว"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
