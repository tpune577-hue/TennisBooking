"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiffConnectionError } from "@/components/liff/liff-connection-error";
import { Calendar, Clock, Loader2, Plus, QrCode, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function LiffBookingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isReady: liffReady, error: liffError } = useLiff();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/bookings");
    }
  }, [status, router]);

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

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (liffError) {
    return <LiffConnectionError detail={liffError} />;
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.startTime) >= now
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || new Date(b.startTime) < now
  );
  const visible = tab === "upcoming" ? upcoming : past;

  async function cancel(booking: Booking) {
    const hrs = hoursUntil(booking.startTime);
    const willRefund = hrs >= 24;
    const message = willRefund
      ? `ยกเลิกการจอง ${booking.court.name}?\n\nเครดิตจะคืนเข้าบัญชีเมื่อยกเลิกสำเร็จ`
      : `ยกเลิกการจอง ${booking.court.name}?\n\nยกเลิกภายใน 24 ชม. ก่อนเวลาเล่น จึงไม่คืนเครดิต`;
    if (!confirm(message)) return;
    const id = booking.id;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({
          msg: data.error ?? "ยกเลิกไม่สำเร็จ กรุณาลองอีกครั้ง",
          ok: false,
        });
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
    <div className="p-4 pb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">การจองของฉัน</h1>
        <Link href="/liff/book">
          <Button size="sm" className="h-9 gap-1">
            <Plus className="h-4 w-4" />
            จองใหม่
          </Button>
        </Link>
      </div>

      {toast && (
        <div
          className={cn(
            "rounded-xl border p-3 text-sm flex items-center gap-2",
            toast.ok
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={tab === "upcoming" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setTab("upcoming")}
        >
          กำลังมาถึง ({upcoming.length})
        </Button>
        <Button
          variant={tab === "past" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setTab("past")}
        >
          ผ่านมาแล้ว ({past.length})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-10 px-4 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">
            {tab === "upcoming"
              ? "ยังไม่มีการจองที่กำลังมาถึง"
              : "ยังไม่มีประวัติการจอง"}
          </p>
          {tab === "upcoming" ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                จองคอร์ตเพื่อดูรายการที่นี่
              </p>
              <Link href="/liff/book">
                <Button size="sm">จองคอร์ต</Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              การจองที่ผ่านมาแล้วหรือยกเลิกจะแสดงที่นี่
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const canCancel = b.status === "confirmed" && new Date(b.startTime) > now;
            const hrs = hoursUntil(b.startTime);
            const willRefund = hrs >= 24;

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{b.court.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {b.bookingRef}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </span>
                    </div>
                    {b.coach && (
                      <p className="text-xs text-muted-foreground">
                        โค้ช: {b.coach.user.name}
                      </p>
                    )}
                    <Badge
                      variant={
                        b.status === "confirmed"
                          ? "default"
                          : b.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px] mt-1"
                    >
                      {b.status === "confirmed"
                        ? "ยืนยันแล้ว"
                        : b.status === "cancelled"
                          ? "ยกเลิก"
                          : b.status === "completed"
                            ? "เสร็จแล้ว"
                            : b.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold tabular-nums shrink-0">
                    {b.totalCreditCost} เครดิต
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  {b.status === "confirmed" && new Date(b.startTime) >= now && (
                    <Link
                      href={`/liff/access?bookingId=${b.id}`}
                      className="inline-flex items-center text-xs border border-border rounded-lg px-3 py-2 bg-secondary hover:bg-secondary/80 font-medium"
                    >
                      <QrCode className="h-3.5 w-3.5 mr-1.5" />
                      QR เข้าสนาม
                    </Link>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive border-destructive/30"
                      onClick={() => cancel(b)}
                      disabled={cancelling === b.id}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {cancelling === b.id ? "กำลังยกเลิก..." : "ยกเลิก"}
                    </Button>
                  )}
                </div>
                {canCancel && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {willRefund
                      ? "ยกเลิกก่อนเวลาเล่น 24 ชม. คืนเครดิต"
                      : "ยกเลิกภายใน 24 ชม. ก่อนเวลาเล่น ไม่คืนเครดิต"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
