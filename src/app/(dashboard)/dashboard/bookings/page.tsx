"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, Clock, X, AlertCircle, QrCode } from "lucide-react";

interface Booking {
  id: string;
  bookingRef: string;
  type: "court_only" | "court_with_coach";
  status: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalCreditCost: number;
  creditRefunded: boolean;
  court: { id: string; name: string; type: string };
  coach: { id: string; pricePerHour: number; user: { name: string } } | null;
}

function formatDate(s: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(s));
}

function formatTime(s: string) {
  const d = new Date(s);
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

function hoursUntil(s: string) {
  return (new Date(s).getTime() - Date.now()) / (1000 * 60 * 60);
}

export default function BookingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.startTime) >= now
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || new Date(b.startTime) < now
  );
  const visible = tab === "upcoming" ? upcoming : past;

  async function cancel(id: string) {
    if (!confirm("ยืนยันการยกเลิกการจอง?")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error ?? "เกิดข้อผิดพลาด", ok: false });
      } else {
        setToast({
          msg: data.refunded
            ? `ยกเลิกสำเร็จ — คืน ${data.creditRefunded} เครดิต`
            : "ยกเลิกสำเร็จ (ไม่คืนเครดิตเนื่องจากยกเลิกไม่ถึง 24 ชั่วโมงก่อน)",
          ok: true,
        });
        load();
      }
    } finally {
      setCancelling(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">การจองของฉัน</h1>

      {toast && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${toast.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={tab === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("upcoming")}
        >
          กำลังจะมาถึง ({upcoming.length})
        </Button>
        <Button
          variant={tab === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("past")}
        >
          ผ่านมาแล้ว ({past.length})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {tab === "upcoming" ? "ยังไม่มีการจองที่กำลังจะมาถึง" : "ยังไม่มีประวัติการจอง"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const canCancel = b.status === "confirmed" && new Date(b.startTime) > now;
            const hrs = hoursUntil(b.startTime);
            const willRefund = hrs >= 24;

            return (
              <div key={b.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{b.court.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{b.bookingRef}</Badge>
                      <Badge
                        variant={
                          b.status === "confirmed" ? "default" :
                          b.status === "cancelled" ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {b.status === "confirmed" ? "ยืนยันแล้ว" :
                         b.status === "cancelled" ? "ยกเลิก" :
                         b.status === "completed" ? "เสร็จแล้ว" : b.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(b.startTime)} – {formatTime(b.endTime)} ({b.durationHours} ชม.)
                      </span>
                    </div>
                    {b.coach && (
                      <p className="text-xs text-muted-foreground">โค้ช: {b.coach.user.name}</p>
                    )}
                    {b.status === "cancelled" && (
                      <p className="text-xs text-muted-foreground">
                        {b.creditRefunded ? `คืนเครดิต ${b.totalCreditCost} เครดิต` : "ไม่คืนเครดิต"}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{b.totalCreditCost} เครดิต</span>
                    {b.status === "confirmed" && (
                      <Link
                        href={`/dashboard/access?bookingId=${b.id}`}
                        className="inline-flex items-center text-xs border border-border rounded-md px-2 py-1 bg-secondary hover:bg-secondary/80"
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        QR เข้าสนาม
                      </Link>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => cancel(b.id)}
                        disabled={cancelling === b.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {cancelling === b.id ? "กำลังยกเลิก..." : "ยกเลิก"}
                      </Button>
                    )}
                    {canCancel && (
                      <p className="text-xs text-muted-foreground">
                        {willRefund ? "✓ คืนเครดิต" : "✗ ไม่คืนเครดิต"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
