import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Trophy } from "lucide-react";

interface AdminStatsCardsProps {
  bookingsToday: number;
  totalMembers: number;
  activeCourts: number;
}

export function AdminStatsCards({
  bookingsToday,
  totalMembers,
  activeCourts,
}: AdminStatsCardsProps) {
  const stats = [
    {
      title: "การจองวันนี้",
      value: bookingsToday,
      icon: CalendarDays,
      description: "การจองทั้งหมดวันนี้",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "สมาชิกทั้งหมด",
      value: totalMembers,
      icon: Users,
      description: "สมาชิก active ในระบบ",
      iconBg: "bg-[color:var(--chart-2)]/10",
      iconColor: "text-[color:var(--chart-2)]",
    },
    {
      title: "สนามที่เปิดให้บริการ",
      value: activeCourts,
      icon: Trophy,
      description: "จาก 7 สนามทั้งหมด",
      iconBg: "bg-[color:var(--chart-3)]/10",
      iconColor: "text-[color:var(--chart-3)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
