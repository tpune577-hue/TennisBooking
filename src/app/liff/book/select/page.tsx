"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { format, addDays, startOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, Clock, Coins, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Court = {
  id: string;
  name: string;
  type: "outdoor" | "indoor" | "clay";
  openTime: string;
  closeTime: string;
  pricing: {
    peakPricePerHour: number;
    offPeakPricePerHour: number;
    peakStartTime: string;
    peakEndTime: string;
  } | null;
};

type Coach = {
  id: string;
  name: string;
  avatarUrl: string | null;
  pricePerHour: number;
  bio: string | null;
};

type TimeSlot = {
  hour: number;
  available: boolean;
  isPeak: boolean;
  pricePerHour: number;
};

const COURT_TYPE_LABELS = {
  outdoor: {
    label: "Outdoor",
    color: "bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)] border-[color:var(--chart-2)]/25",
  },
  indoor: {
    label: "Indoor",
    color: "bg-primary/10 text-primary border-primary/25",
  },
  clay: {
    label: "Clay",
    color: "bg-[color:var(--chart-3)]/10 text-[color:var(--chart-3)] border-[color:var(--chart-3)]/25",
  },
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <p className="font-bold text-sm text-foreground mb-3">{label}</p>
      {children}
    </div>
  );
}

function SelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();

  const bookingType =
    (searchParams.get("type") as "court_only" | "court_with_coach") ??
    "court_only";

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

  // Load courts once on mount
  useEffect(() => {
    fetch("/api/courts")
      .then((r) => r.json())
      .then((data) => setCourts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("โหลดข้อมูลสนามไม่สำเร็จ"))
      .finally(() => setLoadingCourts(false));
  }, []);

  // Load slots when court or date changes
  useEffect(() => {
    if (!selectedCourt) return;
    setLoadingSlots(true);
    setStartHour(null);
    setEndHour(null);
    setPendingStart(null);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    fetch(
      `/api/bookings/availability?courtId=${selectedCourt.id}&date=${dateStr}`
    )
      .then((r) => r.json())
      .then((data) =>
        setSlots(Array.isArray(data.slots) ? data.slots : [])
      )
      .catch(() => toast.error("โหลดช่วงเวลาไม่สำเร็จ"))
      .finally(() => setLoadingSlots(false));
  }, [selectedCourt, selectedDate]);

  // Load coaches when time range is selected (court_with_coach only)
  useEffect(() => {
    if (
      bookingType !== "court_with_coach" ||
      startHour === null ||
      endHour === null ||
      coaches.length > 0
    )
      return;
    setLoadingCoaches(true);
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((data) => setCoaches(Array.isArray(data) ? data : []))
      .catch(() => toast.error("โหลดข้อมูลโค้ชไม่สำเร็จ"))
      .finally(() => setLoadingCoaches(false));
  }, [bookingType, startHour, endHour, coaches.length]);

  const courtCost =
    startHour !== null && endHour !== null
      ? slots
          .filter((s) => s.hour >= startHour && s.hour < endHour)
          .reduce((sum, s) => sum + s.pricePerHour, 0)
      : 0;

  const coachCost =
    selectedCoach && startHour !== null && endHour !== null
      ? selectedCoach.pricePerHour * (endHour - startHour)
      : 0;

  const canProceed =
    selectedCourt !== null &&
    startHour !== null &&
    endHour !== null &&
    (bookingType === "court_only" || selectedCoach !== null);

  function handleSlotClick(slot: TimeSlot) {
    if (!slot.available) return;

    if (pendingStart === null) {
      setPendingStart(slot.hour);
      setStartHour(null);
      setEndHour(null);
    } else {
      const from = Math.min(pendingStart, slot.hour);
      const to = Math.max(pendingStart, slot.hour) + 1;
      const rangeValid = slots
        .filter((s) => s.hour >= from && s.hour < to)
        .every((s) => s.available);

      if (!rangeValid) {
        toast.error("มีช่วงเวลาที่ถูกจองแล้วในช่วงที่เลือก");
        setPendingStart(null);
        return;
      }

      setStartHour(from);
      setEndHour(to);
      setPendingStart(null);
    }
  }

  function isInRange(hour: number) {
    if (startHour !== null && endHour !== null) {
      return hour >= startHour && hour < endHour;
    }
    if (pendingStart !== null) {
      return hour === pendingStart;
    }
    return false;
  }

  function handleNext() {
    if (!canProceed || !selectedCourt) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const p = new URLSearchParams({
      type: bookingType,
      date: dateStr,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      courtType: selectedCourt.type,
      startHour: String(startHour),
      endHour: String(endHour),
      courtCost: String(courtCost),
    });
    if (selectedCoach) {
      p.set("coachId", selectedCoach.id);
      p.set("coachName", selectedCoach.name);
      p.set("coachCost", String(coachCost));
    }
    router.push(`/liff/book/confirm?${p.toString()}`);
  }

  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const creditBalance =
    (session?.user as unknown as { creditBalance?: number })?.creditBalance ?? 0;

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold">เลือกสนามและเวลา</h1>
            <p className="text-xs text-muted-foreground">
              {bookingType === "court_with_coach"
                ? "จองสนาม + โค้ช"
                : "จองสนามอย่างเดียว"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold tabular-nums">{creditBalance}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">

        {/* Date strip */}
        <Section label="📅 เลือกวันที่">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {days.map((day, i) => {
              const isToday = i === 0;
              const isActive =
                format(day, "yyyy-MM-dd") ===
                format(selectedDate, "yyyy-MM-dd");
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setStartHour(null);
                    setEndHour(null);
                  }}
                  className={cn(
                    "min-w-[56px] flex-none flex flex-col items-center py-2.5 px-1 rounded-2xl border-2 transition-all",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-[10px] font-semibold opacity-80 uppercase">
                    {format(day, "EEE", { locale: th })}
                  </span>
                  <span className="text-xl font-black leading-tight">
                    {format(day, "d")}
                  </span>
                  {isToday && (
                    <span
                      className={cn(
                        "text-[9px] font-bold",
                        isActive ? "opacity-80" : "text-primary"
                      )}
                    >
                      วันนี้
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Court selection */}
        <Section label="🏟️ เลือกสนาม">
          {loadingCourts ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {courts.map((court) => {
                const isActive = selectedCourt?.id === court.id;
                const typeInfo = COURT_TYPE_LABELS[court.type];
                return (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-left",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/30"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "font-bold text-sm",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {court.name}
                        </p>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            typeInfo.color
                          )}
                        >
                          {typeInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {court.openTime} – {court.closeTime}
                        </span>
                      </div>
                    </div>
                    {court.pricing && (
                      <div className="text-right shrink-0 ml-3">
                        <p
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {court.pricing.offPeakPricePerHour} cr/ชม.
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 justify-end">
                          <Zap className="h-2.5 w-2.5 text-amber-400" />
                          Peak {court.pricing.peakPricePerHour}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* Time slot grid */}
        {selectedCourt && (
          <Section label="⏰ เลือกช่วงเวลา">
            {loadingSlots ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {pendingStart !== null && (
                  <p className="text-xs text-primary animate-pulse mb-2">
                    เลือกเวลาสิ้นสุด...
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const inRange = isInRange(slot.hour);
                    const isNight = slot.hour >= 18;
                    return (
                      <button
                        key={slot.hour}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.available}
                        className={cn(
                          "rounded-xl border py-2.5 text-center text-sm transition-all",
                          !slot.available &&
                            "bg-muted/20 text-muted-foreground/40 border-border/30 cursor-not-allowed",
                          slot.available &&
                            !inRange &&
                            "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5",
                          inRange &&
                            !slot.isPeak &&
                            "bg-primary text-primary-foreground border-primary",
                          inRange &&
                            slot.isPeak &&
                            "bg-amber-500 text-white border-amber-500"
                        )}
                      >
                        <div className="font-semibold">
                          {String(slot.hour).padStart(2, "0")}:00
                        </div>
                        {slot.available && !inRange && (
                          <div className="text-[9px] mt-0.5 leading-none">
                            {slot.isPeak ? (
                              <span className="text-amber-500">⚡</span>
                            ) : isNight ? (
                              "🌙"
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-primary inline-block" />
                    เลือกแล้ว
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-500 inline-block" />
                    Peak
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-muted/30 border border-border/30 inline-block" />
                    ไม่ว่าง
                  </span>
                </div>

                {startHour !== null && endHour !== null && (
                  <div className="mt-3 rounded-xl bg-muted/30 border border-border p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ช่วงเวลา</span>
                      <span className="font-semibold">
                        {String(startHour).padStart(2, "0")}:00 –{" "}
                        {String(endHour).padStart(2, "0")}:00 (
                        {endHour - startHour} ชม.)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ค่าสนาม</span>
                      <span className="font-semibold tabular-nums">
                        {courtCost} เครดิต
                      </span>
                    </div>
                  </div>
                )}

                {pendingStart !== null && (
                  <button
                    onClick={() => setPendingStart(null)}
                    className="mt-2 text-xs text-muted-foreground underline w-full text-center"
                  >
                    ยกเลิกการเลือก
                  </button>
                )}
              </>
            )}
          </Section>
        )}

        {/* Coach selection */}
        {bookingType === "court_with_coach" &&
          startHour !== null &&
          endHour !== null && (
            <Section label="👨‍🏫 เลือกโค้ช">
              {loadingCoaches ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : coaches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ไม่มีโค้ชว่างในขณะนี้
                </p>
              ) : (
                <div className="space-y-2">
                  {coaches.map((coach) => {
                    const isActive = selectedCoach?.id === coach.id;
                    const initials = coach.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <button
                        key={coach.id}
                        onClick={() => setSelectedCoach(coach)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all",
                          isActive
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                            : "border-border bg-background hover:border-amber-300"
                        )}
                      >
                        <div
                          className={cn(
                            "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden",
                            isActive
                              ? "bg-amber-200 text-amber-800"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {coach.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coach.avatarUrl}
                              alt={coach.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p
                            className={cn(
                              "font-bold text-sm",
                              isActive ? "text-amber-700" : "text-foreground"
                            )}
                          >
                            {coach.name}
                          </p>
                          {coach.bio && (
                            <p className="text-xs text-muted-foreground truncate">
                              {coach.bio}
                            </p>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm font-bold tabular-nums shrink-0",
                            isActive ? "text-amber-700" : "text-foreground"
                          )}
                        >
                          +{coach.pricePerHour} cr/ชม.
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {canProceed
            ? `ถัดไป — รวม ${courtCost + coachCost} เครดิต`
            : "เลือกให้ครบก่อน"}
        </Button>
      </div>
    </>
  );
}

export default function SelectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SelectContent />
    </Suspense>
  );
}
