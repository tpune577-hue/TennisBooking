"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between text-sm gap-3">
      <span className="flex items-center gap-2 text-muted-foreground shrink-0">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-right text-foreground">{value}</span>
    </div>
  );
}

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();
  const [confirming, setConfirming] = useState(false);

  const type =
    (searchParams.get("type") as "court_only" | "court_with_coach") ??
    "court_only";
  const date = searchParams.get("date") ?? "";
  const courtId = searchParams.get("courtId") ?? "";
  const courtName = searchParams.get("courtName") ?? "";
  const courtType = searchParams.get("courtType") ?? "outdoor";
  const startHour = parseInt(searchParams.get("startHour") ?? "0");
  const endHour = parseInt(searchParams.get("endHour") ?? "0");
  const courtCost = parseInt(searchParams.get("courtCost") ?? "0");
  const coachId = searchParams.get("coachId");
  const coachName = searchParams.get("coachName");
  const coachCost = parseInt(searchParams.get("coachCost") ?? "0");

  const totalCost = courtCost + coachCost;
  const durationHours = endHour - startHour;
  const creditBalance =
    (session?.user as unknown as { creditBalance?: number })?.creditBalance ?? 0;
  const hasEnoughCredits = creditBalance >= totalCost;
  const remaining = creditBalance - totalCost;

  const dateDisplay = date
    ? format(new Date(date + "T12:00:00"), "EEEE d MMMM yyyy", { locale: th })
    : "";

  const courtTypeLabel =
    courtType === "indoor"
      ? "Indoor"
      : courtType === "clay"
      ? "Clay"
      : "Outdoor";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

  // Redirect back if missing required params
  useEffect(() => {
    if (!courtId || !date || !startHour || !endHour) {
      router.replace("/liff/book");
    }
  }, [courtId, date, startHour, endHour, router]);

  async function handleConfirm() {
    if (!hasEnoughCredits) return;
    setConfirming(true);

    const dateStr = date;
    const startTime = new Date(
      `${dateStr}T${String(startHour).padStart(2, "0")}:00:00.000Z`
    ).toISOString();
    const endTime = new Date(
      `${dateStr}T${String(endHour).padStart(2, "0")}:00:00.000Z`
    ).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId,
          coachId: coachId ?? null,
          type,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }

      const p = new URLSearchParams({
        ref: data.booking.bookingRef,
        courtName,
        date,
        startHour: String(startHour),
        endHour: String(endHour),
        total: String(totalCost),
      });
      if (coachName) p.set("coachName", coachName);

      router.push(`/liff/booking-success?${p.toString()}`);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  }

  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">ยืนยันการจอง</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Summary card */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-[color:var(--chart-2)]/10 rounded-2xl flex items-center justify-center text-2xl select-none">
              🎾
            </div>
            <div>
              <p className="font-bold text-base">{courtName}</p>
              <p className="text-sm text-muted-foreground">{courtTypeLabel} Court</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="วันที่"
              value={dateDisplay}
            />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="เวลา"
              value={`${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00 (${durationHours} ชม.)`}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="สนาม"
              value={courtName}
            />
            {coachName && (
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="โค้ช"
                value={coachName}
              />
            )}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="font-bold text-sm mb-4">สรุปค่าใช้จ่าย</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ค่าสนาม ({courtName})</span>
              <span className="font-semibold tabular-nums">{courtCost} เครดิต</span>
            </div>
            {coachCost > 0 && coachName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าโค้ช ({coachName})</span>
                <span className="font-semibold tabular-nums">{coachCost} เครดิต</span>
              </div>
            )}
            <div className="border-t border-dashed border-border pt-3 flex justify-between items-center">
              <span className="font-bold text-base">รวมทั้งหมด</span>
              <span className="font-black text-xl text-primary tabular-nums">
                {totalCost} เครดิต
              </span>
            </div>
          </div>
        </div>

        {/* Credit balance */}
        <div
          className={cn(
            "rounded-2xl p-4 border flex items-start gap-3",
            hasEnoughCredits
              ? "bg-[color:var(--chart-2)]/8 border-[color:var(--chart-2)]/25"
              : "bg-destructive/8 border-destructive/25"
          )}
        >
          {hasEnoughCredits ? (
            <CreditCard className="h-5 w-5 text-[color:var(--chart-2)] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                "font-bold text-sm",
                hasEnoughCredits
                  ? "text-[color:var(--chart-2)]"
                  : "text-destructive"
              )}
            >
              {hasEnoughCredits ? "ชำระด้วยเครดิต" : "เครดิตไม่เพียงพอ"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              เครดิตปัจจุบัน{" "}
              <span className="font-semibold tabular-nums">{creditBalance}</span> cr
              {hasEnoughCredits
                ? ` → หลังจ่าย ${remaining} cr`
                : ` · ขาดอีก ${totalCost - creditBalance} cr`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold text-sm tabular-nums">{creditBalance}</span>
          </div>
        </div>

        {!hasEnoughCredits && (
          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10"
            onClick={() => router.push("/liff/topup")}
          >
            เติมเครดิต
          </Button>
        )}

        {/* Omise payment mockup */}
        <div className="bg-muted/30 rounded-2xl p-4 border border-dashed border-border">
          <p className="text-xs text-muted-foreground text-center font-semibold mb-3">
            🔒 OMISE PAYMENT GATEWAY (Mockup)
          </p>
          <div className="flex gap-2">
            {[
              { icon: "💳", label: "บัตรเครดิต" },
              { icon: "🏦", label: "โอนเงิน" },
              { icon: "📱", label: "PromptPay" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex-1 bg-card rounded-xl py-2.5 text-center border border-border opacity-50"
              >
                <div className="text-lg">{item.icon}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleConfirm}
          disabled={!hasEnoughCredits || confirming}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังจอง...
            </>
          ) : (
            `ยืนยันและชำระ — ${totalCost} เครดิต`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center pb-4">
          ยกเลิกได้ฟรีก่อน 24 ชั่วโมง · เครดิตคืนทันที
        </p>
      </div>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
