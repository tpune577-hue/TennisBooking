"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/lib/liff/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  Coins,
  CalendarDays,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

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

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type BookingForm = {
  type: "court_only" | "court_with_coach" | null;
  date: Date | null;
  court: Court | null;
  startHour: number | null;
  endHour: number | null; // exclusive: booking goes from startHour to endHour
  coach: Coach | null;
};

const COURT_TYPE_LABELS = {
  outdoor: { label: "Outdoor", color: "bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)] border-[color:var(--chart-2)]/25" },
  indoor: { label: "Indoor", color: "bg-primary/10 text-primary border-primary/25" },
  clay: { label: "Clay", color: "bg-[color:var(--chart-3)]/10 text-[color:var(--chart-3)] border-[color:var(--chart-3)]/25" },
};

const STEP_LABELS = ["ประเภท", "วันที่", "สนาม", "เวลา", "โค้ช", "ยืนยัน"];

// ─── Step 1 — Booking Type ─────────────────────────────────────────────────

function BookingTypeStep({
  value,
  onChange,
}: {
  value: BookingForm["type"];
  onChange: (v: "court_only" | "court_with_coach") => void;
}) {
  return (
    <div className="space-y-4 px-4">
      <h2 className="text-lg font-semibold">เลือกประเภทการจอง</h2>
      <div className="grid gap-3">
        {(
          [
            {
              value: "court_only" as const,
              label: "จองสนามอย่างเดียว",
              desc: "เล่นเองหรือกับเพื่อน ไม่รวมโค้ช",
              icon: MapPin,
            },
            {
              value: "court_with_coach" as const,
              label: "จองสนาม + โค้ช",
              desc: "พร้อมโค้ชสอน เพิ่มทักษะเทนนิส",
              icon: User,
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
              value === opt.value
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <div
              className={cn(
                "rounded-lg p-2.5 mt-0.5",
                value === opt.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <opt.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{opt.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            {value === opt.value && (
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2 — Date ─────────────────────────────────────────────────────────

function DateStep({
  value,
  onChange,
  maxDays,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  maxDays: number;
}) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxDays);

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-lg font-semibold">เลือกวันที่จอง</h2>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => d && onChange(d)}
          disabled={(d) => isBefore(d, today) || isBefore(maxDate, d)}
          locale={th}
          className="rounded-xl border border-border bg-card p-3"
        />
      </div>
      {value && (
        <p className="text-center text-sm text-muted-foreground">
          เลือก:{" "}
          <span className="font-medium text-foreground">
            {format(value, "EEEE dd MMMM yyyy", { locale: th })}
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Step 3 — Court ─────────────────────────────────────────────────────────

function CourtStep({
  courts,
  value,
  onChange,
  loading,
}: {
  courts: Court[];
  value: Court | null;
  onChange: (c: Court) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-lg font-semibold">เลือกสนาม</h2>
      <div className="grid gap-3">
        {courts.map((court) => {
          const typeInfo = COURT_TYPE_LABELS[court.type];
          const isSelected = value?.id === court.id;
          return (
            <button
              key={court.id}
              onClick={() => onChange(court)}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{court.name}</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      typeInfo.color
                    )}
                  >
                    {typeInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{court.openTime} – {court.closeTime}</span>
                </div>
                {court.pricing && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Peak {court.pricing.peakPricePerHour} cr/ชม.
                    </span>
                    <span>{court.pricing.offPeakPricePerHour} cr/ชม.</span>
                  </div>
                )}
              </div>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4 — Time Slots ─────────────────────────────────────────────────

function TimeSlotStep({
  slots,
  startHour,
  endHour,
  onSelect,
  loading,
}: {
  slots: TimeSlot[];
  startHour: number | null;
  endHour: number | null;
  onSelect: (start: number, end: number) => void;
  loading: boolean;
}) {
  const [selecting, setSelecting] = useState<number | null>(null);

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) return;

    if (selecting === null) {
      setSelecting(slot.hour);
    } else {
      const from = Math.min(selecting, slot.hour);
      const to = Math.max(selecting, slot.hour) + 1;

      // Check all slots in range are available
      const rangeValid = slots
        .filter((s) => s.hour >= from && s.hour < to)
        .every((s) => s.available);

      if (!rangeValid) {
        toast.error("มีช่วงเวลาที่ถูกจองแล้วในช่วงที่เลือก");
        setSelecting(null);
        return;
      }

      onSelect(from, to);
      setSelecting(null);
    }
  };

  const isInRange = (hour: number) => {
    if (startHour !== null && endHour !== null) {
      return hour >= startHour && hour < endHour;
    }
    if (selecting !== null) {
      return hour === selecting;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalCost =
    startHour !== null && endHour !== null
      ? slots
          .filter((s) => s.hour >= startHour && s.hour < endHour)
          .reduce((sum, s) => sum + s.pricePerHour, 0)
      : null;

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">เลือกช่วงเวลา</h2>
        {selecting !== null && (
          <span className="text-xs text-muted-foreground animate-pulse">
            เลือกเวลาสิ้นสุด...
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const inRange = isInRange(slot.hour);
          const isStart = slot.hour === startHour;
          const isEnd = slot.hour === (endHour ?? 0) - 1;

          return (
            <button
              key={slot.hour}
              onClick={() => handleSlotClick(slot)}
              disabled={!slot.available}
              className={cn(
                "rounded-lg border py-3 text-center text-sm transition-all",
                !slot.available && "bg-muted/30 text-muted-foreground/50 border-border/30 cursor-not-allowed",
                slot.available && !inRange && "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5",
                inRange && "bg-primary text-primary-foreground border-primary",
                inRange && slot.isPeak && "bg-amber-500 text-white border-amber-500",
                (isStart || isEnd) && "font-semibold"
              )}
            >
              <div>{String(slot.hour).padStart(2, "0")}:00</div>
              {slot.available && !inRange && (
                <div className="text-[10px] mt-0.5 text-muted-foreground">
                  {slot.isPeak ? "⚡ Peak" : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary inline-block" />
          เลือกแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-500 inline-block" />
          Peak hour
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-muted/30 border border-border/30 inline-block" />
          ไม่ว่าง
        </span>
      </div>

      {startHour !== null && endHour !== null && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>ช่วงเวลา</span>
            <span className="font-medium text-foreground">
              {String(startHour).padStart(2, "0")}:00 – {String(endHour).padStart(2, "0")}:00
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>ระยะเวลา</span>
            <span className="font-medium text-foreground">{endHour - startHour} ชั่วโมง</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>ค่าสนาม</span>
            <span className="font-medium text-foreground tabular-nums">{totalCost} เครดิต</span>
          </div>
        </div>
      )}

      {selecting !== null && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setSelecting(null)}
        >
          ยกเลิกการเลือก
        </Button>
      )}
    </div>
  );
}

// ─── Step 5 — Coach ─────────────────────────────────────────────────────────

function CoachStep({
  coaches,
  value,
  onChange,
  loading,
}: {
  coaches: Coach[];
  value: Coach | null;
  onChange: (c: Coach) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-lg font-semibold">เลือกโค้ช</h2>
      {coaches.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">ไม่มีโค้ชว่างในขณะนี้</p>
      )}
      <div className="grid gap-3">
        {coaches.map((coach) => {
          const isSelected = value?.id === coach.id;
          const initials = coach.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              key={coach.id}
              onClick={() => onChange(coach)}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden shrink-0">
                {coach.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.avatarUrl} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{coach.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {coach.pricePerHour} เครดิต/ชั่วโมง
                </p>
                {coach.bio && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{coach.bio}</p>
                )}
              </div>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 6 — Confirm ───────────────────────────────────────────────────────

function ConfirmStep({
  form,
  slots,
  creditBalance,
  confirming,
  onConfirm,
}: {
  form: BookingForm;
  slots: TimeSlot[];
  creditBalance: number;
  confirming: boolean;
  onConfirm: () => void;
}) {
  const { court, date, startHour, endHour, coach, type } = form;
  if (!court || !date || startHour === null || endHour === null) return null;

  const durationHours = endHour - startHour;
  const courtCost = slots
    .filter((s) => s.hour >= startHour && s.hour < endHour)
    .reduce((sum, s) => sum + s.pricePerHour, 0);
  const coachCost = coach ? coach.pricePerHour * durationHours : 0;
  const totalCost = courtCost + coachCost;
  const hasEnoughCredits = creditBalance >= totalCost;

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-lg font-semibold">ยืนยันการจอง</h2>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="flex justify-between p-4 text-sm">
          <span className="text-muted-foreground">สนาม</span>
          <span className="font-medium text-foreground">{court.name}</span>
        </div>
        <div className="flex justify-between p-4 text-sm">
          <span className="text-muted-foreground">วันที่</span>
          <span className="font-medium text-foreground">
            {format(date, "d MMM yyyy", { locale: th })}
          </span>
        </div>
        <div className="flex justify-between p-4 text-sm">
          <span className="text-muted-foreground">เวลา</span>
          <span className="font-medium text-foreground">
            {String(startHour).padStart(2, "0")}:00 – {String(endHour).padStart(2, "0")}:00
            <span className="text-muted-foreground ml-1">({durationHours} ชม.)</span>
          </span>
        </div>
        {coach && (
          <div className="flex justify-between p-4 text-sm">
            <span className="text-muted-foreground">โค้ช</span>
            <span className="font-medium text-foreground">{coach.name}</span>
          </div>
        )}
        <div className="flex justify-between p-4 text-sm">
          <span className="text-muted-foreground">ค่าสนาม</span>
          <span className="font-medium text-foreground tabular-nums">{courtCost} เครดิต</span>
        </div>
        {coachCost > 0 && (
          <div className="flex justify-between p-4 text-sm">
            <span className="text-muted-foreground">ค่าโค้ช</span>
            <span className="font-medium text-foreground tabular-nums">{coachCost} เครดิต</span>
          </div>
        )}
        <div className="flex justify-between p-4 text-sm font-semibold">
          <span>รวม</span>
          <span className="text-primary tabular-nums">{totalCost} เครดิต</span>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4 flex items-center justify-between text-sm",
          hasEnoughCredits
            ? "border-[color:var(--chart-2)]/25 bg-[color:var(--chart-2)]/8"
            : "border-destructive/30 bg-destructive/10"
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Coins className="h-4 w-4" />
          <span>เครดิตปัจจุบัน</span>
        </div>
        <span
          className={cn(
            "font-semibold tabular-nums",
            hasEnoughCredits ? "text-[color:var(--chart-2)]" : "text-destructive"
          )}
        >
          {creditBalance} เครดิต
        </span>
      </div>

      {!hasEnoughCredits && (
        <p className="text-xs text-destructive text-center">
          เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อนจอง
        </p>
      )}

      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={onConfirm}
        disabled={!hasEnoughCredits || confirming}
      >
        {confirming ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            กำลังจอง...
          </>
        ) : (
          `ยืนยันจอง (${totalCost} เครดิต)`
        )}
      </Button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LiffBookPage() {
  const { data: session, status } = useSession();
  const { isReady: liffReady, error: liffError } = useLiff();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<BookingForm>({
    type: null,
    date: null,
    court: null,
    startHour: null,
    endHour: null,
    coach: null,
  });

  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/sign-in?callbackUrl=/liff/book`);
    }
  }, [status, router]);

  // Load courts when reaching step 3
  useEffect(() => {
    if (step === 3 && courts.length === 0) {
      setLoadingCourts(true);
      fetch("/api/courts")
        .then((r) => r.json())
        .then((data) => setCourts(Array.isArray(data) ? data : []))
        .catch(() => toast.error("โหลดข้อมูลสนามไม่สำเร็จ"))
        .finally(() => setLoadingCourts(false));
    }
  }, [step, courts.length]);

  // Load availability when reaching step 4
  useEffect(() => {
    if (step === 4 && form.court && form.date) {
      setLoadingSlots(true);
      const dateStr = format(form.date, "yyyy-MM-dd");
      fetch(`/api/bookings/availability?courtId=${form.court.id}&date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
        .catch(() => toast.error("โหลดข้อมูลช่วงเวลาไม่สำเร็จ"))
        .finally(() => setLoadingSlots(false));
    }
  }, [step, form.court, form.date]);

  // Load coaches when reaching step 5
  useEffect(() => {
    if (step === 5 && coaches.length === 0) {
      setLoadingCoaches(true);
      fetch("/api/coaches")
        .then((r) => r.json())
        .then((data) => setCoaches(Array.isArray(data) ? data : []))
        .catch(() => toast.error("โหลดข้อมูลโค้ชไม่สำเร็จ"))
        .finally(() => setLoadingCoaches(false));
    }
  }, [step, coaches.length]);

  const handleConfirm = useCallback(async () => {
    if (!form.court || !form.date || form.startHour === null || form.endHour === null) return;
    setConfirming(true);

    const dateStr = format(form.date, "yyyy-MM-dd");
    const startTime = new Date(`${dateStr}T${String(form.startHour).padStart(2, "0")}:00:00.000Z`).toISOString();
    const endTime = new Date(`${dateStr}T${String(form.endHour).padStart(2, "0")}:00:00.000Z`).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: form.court.id,
          coachId: form.coach?.id ?? null,
          type: form.type,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      toast.success(`จองสำเร็จ! รหัส: ${data.booking.bookingRef}`);
      router.push(`/liff/booking-success?ref=${data.booking.bookingRef}`);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  }, [form, router]);

  // Determine advance booking days from session tier (default 7)
  const maxDays = 7;

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return form.type !== null;
      case 2: return form.date !== null;
      case 3: return form.court !== null;
      case 4: return form.startHour !== null && form.endHour !== null;
      case 5: return form.coach !== null;
      case 6: return false;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 4 && form.type === "court_only") {
      setStep(6); // skip coach step
    } else if (step < 6) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step === 6 && form.type === "court_only") {
      setStep(4);
    } else if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const totalSteps = form.type === "court_only" ? 5 : 6;
  const effectiveStep = step === 6 && form.type === "court_only" ? 5 : step;

  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">ไม่สามารถเปิด LIFF ได้</p>
        <p className="text-xs text-muted-foreground/60">{liffError}</p>
      </div>
    );
  }

  const creditBalance = (session?.user as { creditBalance?: number })?.creditBalance ?? 0;
  const userName = session?.user?.name ?? "";

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-sm font-semibold">จองสนามเทนนิส</h1>
            {userName && (
              <p className="text-xs text-muted-foreground">{userName}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium text-foreground tabular-nums">{creditBalance}</span>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-1 px-4 pb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-all",
                i < effectiveStep
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto py-5">
        {step === 1 && (
          <BookingTypeStep
            value={form.type}
            onChange={(t) => setForm((f) => ({ ...f, type: t, coach: null, coachId: null } as BookingForm))}
          />
        )}
        {step === 2 && (
          <DateStep
            value={form.date}
            onChange={(d) => setForm((f) => ({ ...f, date: d, startHour: null, endHour: null }))}
            maxDays={maxDays}
          />
        )}
        {step === 3 && (
          <CourtStep
            courts={courts}
            value={form.court}
            onChange={(c) =>
              setForm((f) => ({ ...f, court: c, startHour: null, endHour: null }))
            }
            loading={loadingCourts}
          />
        )}
        {step === 4 && (
          <TimeSlotStep
            slots={slots}
            startHour={form.startHour}
            endHour={form.endHour}
            onSelect={(s, e) => setForm((f) => ({ ...f, startHour: s, endHour: e }))}
            loading={loadingSlots}
          />
        )}
        {step === 5 && (
          <CoachStep
            coaches={coaches}
            value={form.coach}
            onChange={(c) => setForm((f) => ({ ...f, coach: c }))}
            loading={loadingCoaches}
          />
        )}
        {step === 6 && (
          <ConfirmStep
            form={form}
            slots={slots}
            creditBalance={creditBalance}
            confirming={confirming}
            onConfirm={handleConfirm}
          />
        )}
      </div>

      {/* Bottom navigation */}
      {step < 6 && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur px-4 py-4">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 5 ? "ดูสรุปการจอง" : "ถัดไป"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </>
  );
}
