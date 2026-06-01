"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CalendarDays, X, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Booking {
  id: string;
  bookingRef: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalCreditCost: number;
  creditRefunded: boolean;
  user: { name: string; email: string | null; avatarUrl: string | null };
  court: { name: string; type: string };
  coach: { user: { name: string } } | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed:  { label: "ยืนยันแล้ว", variant: "default" },
  cancelled:  { label: "ยกเลิก", variant: "destructive" },
  completed:  { label: "เสร็จแล้ว", variant: "secondary" },
  pending:    { label: "รอดำเนินการ", variant: "outline" },
  no_show:    { label: "ไม่มา", variant: "destructive" },
};

function formatDt(s: string) {
  const d = new Date(s);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function cancel(id: string) {
    if (!confirm("ยืนยันการยกเลิกการจอง?")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      setToast({ msg: res.ok ? "ยกเลิกสำเร็จ" : (data.error ?? "เกิดข้อผิดพลาด"), ok: res.ok });
      if (res.ok) load();
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCancelling(null);
    }
  }

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.totalCreditCost, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">จัดการการจอง</h1>

      {toast && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${toast.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">การจองที่ยืนยัน</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เครดิตที่ใช้ (ช่วงที่เลือก)</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">สถานะ</p>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
              <SelectItem value="cancelled">ยกเลิก</SelectItem>
              <SelectItem value="completed">เสร็จแล้ว</SelectItem>
              <SelectItem value="no_show">ไม่มา</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">วันที่เริ่ม</p>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">วันที่สิ้นสุด</p>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setStatus("all"); setDateFrom(""); setDateTo(""); }}>
          รีเซ็ต
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัส</TableHead>
              <TableHead>สมาชิก</TableHead>
              <TableHead>สนาม</TableHead>
              <TableHead>วันที่/เวลา</TableHead>
              <TableHead>เครดิต</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบการจอง</TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => {
                const s = STATUS_LABELS[b.status] ?? { label: b.status, variant: "outline" as const };
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.bookingRef}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{b.user.name}</p>
                        {b.user.email && <p className="text-xs text-muted-foreground">{b.user.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{b.court.name}</p>
                        {b.coach && <p className="text-xs text-muted-foreground">โค้ช: {b.coach.user.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDt(b.startTime)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{b.totalCreditCost}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => cancel(b.id)}
                          disabled={cancelling === b.id}
                        >
                          {cancelling === b.id ? "..." : "ยกเลิก"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
