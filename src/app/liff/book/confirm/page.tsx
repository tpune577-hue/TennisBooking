"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { useCreditBalance } from "@/hooks/use-credit-balance";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookingPanel,
  BookingSummary,
  LiffBookingHeader,
} from "@/components/liff/booking/booking-ui";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();
  const { creditBalance, loading: balanceLoading } = useCreditBalance();
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
  const hasEnoughCredits = !balanceLoading && creditBalance >= totalCost;
  const remaining = creditBalance - totalCost;

  const dateDisplay = date
    ? format(new Date(date + "T12:00:00"), "EEEE d MMMM yyyy", { locale: th })
    : "";

  const courtTypeLabel =
    courtType === "indoor"
      ? "ในร่ม"
      : courtType === "clay"
        ? "คอร์ตดิน"
        : "กลางแจ้ง";

  const timeRange = `${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

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
        toast.error(data.error ?? "จองไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }

      const p = new URLSearchParams({
        bookingId: data.booking.id,
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
      toast.error("จองไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง");
    } finally {
      setConfirming(false);
    }
  }

  if ((status === "loading" && !session) || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const summaryRows = [
    { label: "วัน", value: dateDisplay || "—" },
    { label: "คอร์ต", value: courtName },
    { label: "ประเภท", value: `${courtTypeLabel} · ${durationHours} ชม.` },
    { label: "เวลา", value: timeRange },
  ];
  if (coachName) {
    summaryRows.push({ label: "โค้ช", value: coachName });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <LiffBookingHeader
        title="ยืนยันการจอง"
        subtitle="ตรวจสอบรายละเอียดก่อนชำระด้วยเครดิต"
        onBack={() => router.back()}
        creditBalance={creditBalance}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md px-4 py-4 pb-6 space-y-4">
        <BookingSummary
          rows={summaryRows}
          totalValue={
            totalCost > 0 ? `${totalCost.toLocaleString()} เครดิต` : "—"
          }
          note="หักจากเครดิตคงเหลือ · เติมได้ที่หน้าเติมเครดิต"
          action={
            <Button
              className="w-full h-12 rounded-sm btn-brand text-sm font-semibold"
              onClick={handleConfirm}
              disabled={balanceLoading || !hasEnoughCredits || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังจอง...
                </>
              ) : (
                "ยืนยันการจอง"
              )}
            </Button>
          }
        />

        {(courtCost > 0 || coachCost > 0) && (
          <BookingPanel>
            <p className="text-sm font-semibold text-[var(--brand-oak-deep)] mb-3">
              รายละเอียดค่าใช้จ่าย
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-booking-subtle">ค่าสนาม</span>
                <span className="font-semibold tabular-nums">
                  {courtCost.toLocaleString()} เครดิต
                </span>
              </div>
              {coachCost > 0 && coachName ? (
                <div className="flex justify-between gap-3">
                  <span className="text-booking-subtle">ค่าโค้ช</span>
                  <span className="font-semibold tabular-nums">
                    {coachCost.toLocaleString()} เครดิต
                  </span>
                </div>
              ) : null}
            </div>
          </BookingPanel>
        )}

        <div
          className={cn(
            "rounded-sm p-4 border flex items-start gap-3",
            hasEnoughCredits
              ? "bg-[color-mix(in_oklch,var(--brand-paper),var(--primary)_6%)] border-primary/25"
              : "bg-destructive/8 border-destructive/25"
          )}
        >
          {hasEnoughCredits ? (
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-semibold text-sm",
                hasEnoughCredits ? "text-foreground" : "text-destructive"
              )}
            >
              {hasEnoughCredits ? "เครดิตเพียงพอ" : "เครดิตไม่เพียงพอ"}
            </p>
            <p className="text-sm text-booking-subtle mt-0.5 leading-relaxed">
              {hasEnoughCredits
                ? `หลังยืนยันเหลือ ${remaining.toLocaleString()} เครดิต`
                : `ขาดอีก ${(totalCost - creditBalance).toLocaleString()} เครดิต · ไปหน้าเติมเครดิต`}
            </p>
          </div>
        </div>

        {!hasEnoughCredits ? (
          <Button
            variant="outline"
            className="w-full min-h-12 rounded-sm border-primary text-primary hover:bg-primary/5"
            onClick={() => router.push("/liff/topup")}
          >
            เติมเครดิต
          </Button>
        ) : null}

        <p className="text-sm text-booking-subtle text-center leading-relaxed pb-2 text-pretty">
          ยกเลิกได้ฟรีก่อน 24 ชั่วโมง · เครดิตคืนทันที
        </p>
        </div>
      </div>
    </div>
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
