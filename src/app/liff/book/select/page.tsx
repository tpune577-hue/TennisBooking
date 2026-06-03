"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { useCreditBalance } from "@/hooks/use-credit-balance";
import { format, addDays, startOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookingChip,
  BookingField,
  BookingPanel,
  LiffBookingHeader,
} from "@/components/liff/booking/booking-ui";

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
  outdoor: "Outdoor",
  indoor: "Indoor",
  clay: "Clay",
} as const;

function SelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();
  const { creditBalance } = useCreditBalance();

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/courts")
      .then((r) => r.json())
      .then((data) => setCourts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("โหลดข้อมูลสนามไม่สำเร็จ"))
      .finally(() => setLoadingCourts(false));
  }, []);

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

  const totalCost = courtCost + coachCost;

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

  if ((status === "loading" && !session) || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <LiffBookingHeader
        title="เลือกสนามและเวลา"
        subtitle={
          bookingType === "court_with_coach"
            ? "จองสนามพร้อมโค้ช"
            : "จองสนามอย่างเดียว"
        }
        onBack={() => router.back()}
        creditBalance={creditBalance}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-28">
        <BookingPanel className="space-y-5">
          <BookingField step="1" label="เลือกวัน">
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5">
              {days.map((day, i) => {
                const isToday = i === 0;
                const isActive =
                  format(day, "yyyy-MM-dd") ===
                  format(selectedDate, "yyyy-MM-dd");
                return (
                  <BookingChip
                    key={day.toISOString()}
                    variant="date"
                    pressed={isActive}
                    onClick={() => {
                      setSelectedDate(day);
                      setStartHour(null);
                      setEndHour(null);
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-80">
                      {format(day, "EEE", { locale: th })}
                    </span>
                    <b className="font-heading text-lg font-medium leading-none">
                      {format(day, "d")}
                    </b>
                    {isToday ? (
                      <span className="text-[9px] font-semibold opacity-80">
                        วันนี้
                      </span>
                    ) : null}
                  </BookingChip>
                );
              })}
            </div>
          </BookingField>

          <BookingField step="2" label="เลือกคอร์ต">
            {loadingCourts ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {courts.map((court) => {
                  const isActive = selectedCourt?.id === court.id;
                  return (
                    <BookingChip
                      key={court.id}
                      pressed={isActive}
                      onClick={() => setSelectedCourt(court)}
                      className="min-w-[120px]"
                    >
                      <span className="block font-semibold text-[13px]">
                        {court.name}
                      </span>
                      <span className="block text-[10px] opacity-80 mt-0.5">
                        {COURT_TYPE_LABELS[court.type]}
                      </span>
                    </BookingChip>
                  );
                })}
              </div>
            )}
            {selectedCourt ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3 shrink-0" />
                เปิด {selectedCourt.openTime} – {selectedCourt.closeTime}
                {selectedCourt.pricing ? (
                  <>
                    {" "}
                    · Off-peak {selectedCourt.pricing.offPeakPricePerHour} cr
                  </>
                ) : null}
              </p>
            ) : null}
          </BookingField>

          {selectedCourt ? (
            <BookingField step="3" label="เลือกเวลา">
              {loadingSlots ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {pendingStart !== null ? (
                    <p className="text-xs text-primary mb-2">
                      เลือกเวลาสิ้นสุดของช่วงที่ต้องการ
                    </p>
                  ) : null}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-2">
                    {slots.map((slot) => {
                      const inRange = isInRange(slot.hour);
                      const peakInRange =
                        inRange &&
                        slot.isPeak &&
                        startHour !== null &&
                        endHour !== null;
                      return (
                        <BookingChip
                          key={slot.hour}
                          variant="slot"
                          disabled={!slot.available}
                          pressed={inRange && !peakInRange}
                          onClick={() => handleSlotClick(slot)}
                          className={cn(
                            peakInRange &&
                              "!border-[var(--brand-oak-deep)] !bg-[var(--brand-oak-deep)] !text-white",
                            inRange &&
                              pendingStart !== null &&
                              "!border-primary !bg-primary !text-primary-foreground"
                          )}
                        >
                          {String(slot.hour).padStart(2, "0")}:00
                          {slot.available && !inRange && slot.isPeak ? (
                            <span className="block text-[9px] mt-0.5 text-[var(--brand-oak-deep)]">
                              Peak
                            </span>
                          ) : null}
                        </BookingChip>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-primary inline-block" />
                      เลือกแล้ว
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-[var(--brand-oak-deep)] inline-block" />
                      Peak
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-[var(--brand-oak)]" />
                      ช่วง Peak คิดเครดิตสูงกว่า
                    </span>
                  </div>

                  {startHour !== null && endHour !== null ? (
                    <div className="mt-3 rounded-sm border border-border bg-[var(--brand-paper)] p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ช่วงเวลา</span>
                        <span className="font-semibold tabular-nums">
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
                  ) : null}

                  {pendingStart !== null ? (
                    <button
                      type="button"
                      onClick={() => setPendingStart(null)}
                      className="mt-2 text-xs text-muted-foreground underline w-full text-center"
                    >
                      ยกเลิกการเลือกเวลา
                    </button>
                  ) : null}
                </>
              )}
            </BookingField>
          ) : null}
        </BookingPanel>

        {bookingType === "court_with_coach" &&
          startHour !== null &&
          endHour !== null && (
            <BookingPanel>
              <BookingField step="4" label="เลือกโค้ช">
                {loadingCoaches ? (
                  <div className="flex justify-center py-6">
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
                          type="button"
                          onClick={() => setSelectedCoach(coach)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-sm border transition-colors text-left",
                            isActive
                              ? "border-primary bg-[color-mix(in_oklch,var(--brand-paper),var(--primary)_8%)]"
                              : "border-border bg-[var(--brand-paper)] hover:border-[var(--brand-oak)]"
                          )}
                        >
                          <div
                            className={cn(
                              "h-11 w-11 rounded-sm flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden",
                              isActive
                                ? "bg-primary/15 text-primary"
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
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {coach.name}
                            </p>
                            {coach.bio ? (
                              <p className="text-xs text-muted-foreground truncate">
                                {coach.bio}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold tabular-nums shrink-0 text-muted-foreground">
                            +{coach.pricePerHour} cr/ชม.
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </BookingField>
            </BookingPanel>
          )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur px-4 py-4">
        <Button
          className={cn(
            "w-full h-12 rounded-sm text-sm font-semibold tracking-wide uppercase",
            canProceed && "btn-brand"
          )}
          onClick={handleNext}
          disabled={!canProceed}
        >
          {canProceed
            ? `ถัดไป · ${totalCost.toLocaleString()} เครดิต`
            : "เลือกให้ครบก่อน"}
        </Button>
      </div>
    </div>
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
