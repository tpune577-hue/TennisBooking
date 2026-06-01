import { format } from "date-fns";
import { th } from "date-fns/locale";

type Booking = {
  id: string;
  bookingRef: string;
  status: string;
  type: string;
  startTime: Date;
  endTime: Date;
  totalCreditCost: number;
  user: { name: string; avatarUrl: string | null } | null;
  court: { name: string; type: string } | null;
};

/* Inline status badge — semantic colors from the brand palette */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    confirmed: {
      label: "ยืนยันแล้ว",
      className: "bg-[color:var(--chart-2)]/12 text-[color:var(--chart-2)] ring-1 ring-[color:var(--chart-2)]/25",
    },
    pending: {
      label: "รอยืนยัน",
      className: "bg-[color:var(--chart-3)]/12 text-[color:var(--chart-3)] ring-1 ring-[color:var(--chart-3)]/25",
    },
    cancelled: {
      label: "ยกเลิก",
      className: "bg-[color:var(--chart-4)]/12 text-[color:var(--chart-4)] ring-1 ring-[color:var(--chart-4)]/25",
    },
    completed: {
      label: "เสร็จสิ้น",
      className: "bg-muted text-muted-foreground ring-1 ring-border",
    },
    no_show: {
      label: "ไม่มา",
      className: "bg-[color:var(--chart-4)]/12 text-[color:var(--chart-4)] ring-1 ring-[color:var(--chart-4)]/25",
    },
  };
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground ring-1 ring-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

const COURT_TYPE_LABELS: Record<string, string> = {
  outdoor: "Outdoor",
  indoor: "Indoor",
  clay: "Clay",
};

export function RecentBookingsTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        ยังไม่มีการจอง
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">รหัสจอง</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">สมาชิก</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">สนาม</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันเวลา</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credits</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((booking) => {
            return (
              <tr key={booking.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {booking.bookingRef}
                </td>
                <td className="px-4 py-3 font-medium">{booking.user?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  <span>{booking.court?.name ?? "-"}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({COURT_TYPE_LABELS[booking.court?.type ?? ""] ?? ""})
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(booking.startTime), "d MMM HH:mm", { locale: th })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {booking.totalCreditCost.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={booking.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
