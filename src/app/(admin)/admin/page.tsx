import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";
import { eq, gte, and, count, sql } from "drizzle-orm";
import { AdminStatsCards } from "@/components/admin/stats-cards";
import { RecentBookingsTable } from "@/components/admin/recent-bookings-table";

async function getAdminStats() {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [bookingsToday, totalMembers, activeCourts] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.bookings)
      .where(gte(schema.bookings.startTime, today)),
    db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, "customer")),
    db
      .select({ count: count() })
      .from(schema.courts)
      .where(eq(schema.courts.isActive, true)),
  ]);

  const recentBookings = await db.query.bookings.findMany({
    limit: 8,
    orderBy: (b, { desc }) => [desc(b.createdAt)],
    with: {
      user: { columns: { name: true, avatarUrl: true } },
      court: { columns: { name: true, type: true } },
    },
  });

  return {
    bookingsToday: bookingsToday[0].count,
    totalMembers: totalMembers[0].count,
    activeCourts: activeCourts[0].count,
    recentBookings,
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมระบบ Tennis Club</p>
      </div>

      <AdminStatsCards
        bookingsToday={stats.bookingsToday}
        totalMembers={stats.totalMembers}
        activeCourts={stats.activeCourts}
      />

      <div>
        <h2 className="text-lg font-medium text-foreground mb-3">การจองล่าสุด</h2>
        <RecentBookingsTable bookings={stats.recentBookings} />
      </div>
    </div>
  );
}
