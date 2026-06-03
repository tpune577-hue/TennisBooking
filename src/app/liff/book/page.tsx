"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { useCreditBalance } from "@/hooks/use-credit-balance";
import { format, addDays, startOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarOff, Clock, Loader2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookingChip,
  BookingDateSkeleton,
  BookingEmptyState,
  BookingField,
  BookingForm,
  BookingFormSection,
  BookingRangeTip,
  BookingSlotSkeleton,
  BookingStickyFooter,
  BookingTypeToggle,
  type BookingType,
  LiffBookingHeader,
  useBookingRangeTip,
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

const COURT_TYPE_LABELS: Record<Court["type"], string> = {
  outdoor: "กลางแจ้ง",
  indoor: "ในร่ม",
  clay: "คอร์ตดิน",
};

function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();
  const { creditBalance, loading: balanceLoading } = useCreditBalance();

  const initialType =
    searchParams.get("type") === "court_with_coach"
      ? "court_with_coach"
      : "court_only";

  const [bookingType, setBookingType] = useState<BookingType>(initialType);

  const today = startOfDay(new Date());
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i)),
    [today]
  );

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
  const [courtsLoadFailed, setCourtsLoadFailed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const { visible: showRangeTip, dismiss: dismissRangeTip } = useBookingRangeTip();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "court_with_coach" || type === "court_only") {
      setBookingType(type);
    }
  }, [searchParams]);

  function setBookingTypeAndUrl(type: BookingType) {
    setBookingType(type);
    setSelectedCoach(null);
    setCoaches([]);
    const p = new URLSearchParams(searchParams.toString());
    p.set("type", type);
    router.replace(`/liff/book?${p.toString()}`, { scroll: false });
  }

  function loadCourts() {
    setLoadingCourts(true);
    setCourtsLoadFailed(false);
    fetch("/api/courts")
      .then((r) => {
        if (!r.ok) throw new Error("courts");
        return r.json();
      })
      .then((data) => setCourts(Array.isArray(data) ? data : []))
      .catch(() => {
        setCourts([]);
        setCourtsLoadFailed(true);
        toast.error("โหลดรายการคอร์ตไม่สำเร็จ · ลองอีกครั้ง");
      })
      .finally(() => setLoadingCourts(false));
  }

  useEffect(() => {
    loadCourts();
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
      .catch(() =>
        toast.error("โหลดช่วงเวลาว่างไม่สำเร็จ · ลองเลือกวันอื่น")
      )
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
      .catch(() => toast.error("โหลดรายชื่อโค้ชไม่สำเร็จ · ลองอีกครั้ง"))
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

  const selectionComplete =
    selectedCourt !== null &&
    startHour !== null &&
    endHour !== null &&
    (bookingType === "court_only" || selectedCoach !== null);

  const hasEnoughCredits =
    !balanceLoading && creditBalance >= totalCost;
  const creditShortfall = Math.max(0, totalCost - creditBalance);

  const dateLabel = format(selectedDate, "d MMM", { locale: th });

  const summaryLines = useMemo(() => {
    const lines: { label: string; value: string }[] = [];
    lines.push({ label: "วัน", value: dateLabel });
    if (selectedCourt) {
      lines.push({ label: "คอร์ต", value: selectedCourt.name });
    }
    if (startHour !== null && endHour !== null) {
      lines.push({
        label: "เวลา",
        value: `${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`,
      });
    }
    if (bookingType === "court_with_coach" && selectedCoach) {
      lines.push({ label: "โค้ช", value: selectedCoach.name });
    }
    return lines;
  }, [
    dateLabel,
    selectedCourt,
    startHour,
    endHour,
    bookingType,
    selectedCoach,
  ]);

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
        toast.error("มีช่วงที่ถูกจองแล้ว · เลือกช่วงเวลาใหม่");
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

  function handleConfirm() {
    if (!selectionComplete || !selectedCourt || !hasEnoughCredits) return;
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

  const timeHint =
    pendingStart !== null
      ? "แตะเวลาสิ้นสุดของรอบที่ต้องการ"
      : startHour === null
        ? "แตะเวลาเริ่มของรอบที่ต้องการ"
        : null;

  const nextStep = useMemo(() => {
    if (!selectedCourt) {
      return courts.length > 0
        ? "ถัดไป: เลือกคอร์ตจากรายการด้านบน"
        : null;
    }
    if (startHour === null || endHour === null) {
      return pendingStart !== null
        ? "ถัดไป: แตะชั่วโมงสิ้นสุดของรอบ"
        : "ถัดไป: แตะชั่วโมงเริ่ม แล้วแตะชั่วโมงสิ้นสุด";
    }
    if (bookingType === "court_with_coach" && !selectedCoach) {
      return coaches.length > 0
        ? "ถัดไป: เลือกโค้ชสำหรับช่วงเวลานี้"
        : null;
    }
    return null;
  }, [
    selectedCourt,
    courts.length,
    startHour,
    endHour,
    pendingStart,
    bookingType,
    selectedCoach,
    coaches.length,
  ]);

  const showRangeTipBanner =
    showRangeTip &&
    selectedCourt !== null &&
    startHour === null &&
    pendingStart === null;

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
        title="จองคอร์ต"
        subtitle="เลือกวัน คอร์ต และเวลา"
        backHref="/liff/home"
        creditBalance={creditBalance}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(11.5rem+env(safe-area-inset-bottom))] flex flex-col gap-6">
        <BookingTypeToggle
          value={bookingType}
          onChange={setBookingTypeAndUrl}
        />

        {showRangeTip && !selectedCourt && courts.length > 0 ? (
          <BookingRangeTip onDismiss={dismissRangeTip} />
        ) : null}

        <BookingForm aria-busy={loadingSlots || loadingCourts}>
          <BookingFormSection>
          <BookingField step="1" label="เลือกวัน">
            {loadingCourts ? (
              <BookingDateSkeleton />
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                        setPendingStart(null);
                      }}
                    >
                      <span className="text-xs uppercase tracking-wide opacity-80">
                        {format(day, "EEE", { locale: th })}
                      </span>
                      <b className="font-heading text-lg font-medium leading-none">
                        {format(day, "d")}
                      </b>
                      {isToday ? (
                        <span className="text-xs font-semibold opacity-80">
                          วันนี้
                        </span>
                      ) : null}
                    </BookingChip>
                  );
                })}
              </div>
            )}
          </BookingField>
          </BookingFormSection>

          <BookingFormSection>
          <BookingField step="2" label="เลือกคอร์ต">
            {loadingCourts ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 min-w-[120px] flex-1 rounded-sm bg-muted animate-pulse motion-reduce:animate-none"
                  />
                ))}
              </div>
            ) : courts.length === 0 ? (
              <BookingEmptyState
                icon={MapPin}
                title={
                  courtsLoadFailed
                    ? "โหลดรายการคอร์ตไม่สำเร็จ"
                    : "ยังไม่มีคอร์ตให้จอง"
                }
                description={
                  courtsLoadFailed
                    ? "ตรวจสอบการเชื่อมต่อแล้วลองโหลดอีกครั้ง"
                    : "ติดต่อเคาน์เตอร์สโมสรหากคุณคาดว่าควรมีคอร์ตว่าง"
                }
                action={
                  courtsLoadFailed ? (
                    <button
                      type="button"
                      onClick={loadCourts}
                      className="booking-focus-ring text-sm font-semibold text-primary underline-offset-2 hover:underline min-h-11 px-3 rounded-sm"
                    >
                      ลองโหลดอีกครั้ง
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {courts.map((court) => (
                  <BookingChip
                    key={court.id}
                    pressed={selectedCourt?.id === court.id}
                    onClick={() => setSelectedCourt(court)}
                    className="min-w-[120px]"
                  >
                    <span className="block font-semibold text-sm">
                      {court.name}
                    </span>
                    <span className="block text-xs opacity-80 mt-0.5">
                      {COURT_TYPE_LABELS[court.type]}
                    </span>
                  </BookingChip>
                ))}
              </div>
            )}
            {selectedCourt ? (
              <p className="text-sm text-booking-subtle flex items-center gap-1.5 mt-2">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                เปิด {selectedCourt.openTime} – {selectedCourt.closeTime}
                {selectedCourt.pricing ? (
                  <>
                    {" "}
                    · นอกช่วงราคาสูง {selectedCourt.pricing.offPeakPricePerHour}{" "}
                    เครดิต/ชม.
                  </>
                ) : null}
              </p>
            ) : null}
          </BookingField>
          </BookingFormSection>

          {!selectedCourt && !loadingCourts && courts.length > 0 ? (
            <BookingFormSection className="py-5">
              <BookingField step="3" label="เลือกเวลา">
                <BookingEmptyState
                  icon={Clock}
                  title="เลือกคอร์ตก่อน"
                  description="เมื่อเลือกคอร์ตแล้ว จะแสดงช่วงเวลาที่ว่างในวันที่เลือก"
                />
              </BookingField>
            </BookingFormSection>
          ) : null}

          {selectedCourt ? (
            <BookingFormSection className="py-6">
            <BookingField step="3" label="เลือกเวลา">
              {loadingSlots ? (
                <BookingSlotSkeleton />
              ) : slots.length === 0 ||
                !slots.some((s) => s.available) ? (
                <BookingEmptyState
                  icon={CalendarOff}
                  title="ไม่มีช่วงเวลาว่างในวันนี้"
                  description="ลองเลือกวันอื่นที่แถบเลือกวันด้านบน หรือเปลี่ยนคอร์ต"
                />
              ) : (
                <>
                  {showRangeTipBanner ? (
                    <BookingRangeTip onDismiss={dismissRangeTip} />
                  ) : null}
                  {timeHint ? (
                    <p
                      className="text-sm text-primary font-medium -mt-1"
                      role="status"
                    >
                      {timeHint}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
                    {slots.map((slot) => {
                      const inRange = isInRange(slot.hour);
                      const rangeComplete =
                        startHour !== null && endHour !== null;
                      const peakSelected =
                        inRange && rangeComplete && slot.isPeak;
                      return (
                        <BookingChip
                          key={slot.hour}
                          variant="slot"
                          disabled={!slot.available}
                          pressed={inRange && !peakSelected}
                          aria-label={
                            slot.available
                              ? `${String(slot.hour).padStart(2, "0")}:00`
                              : `${String(slot.hour).padStart(2, "0")}:00 ไม่ว่าง`
                          }
                          onClick={() => handleSlotClick(slot)}
                          className={cn(
                            peakSelected &&
                              "!border-[var(--brand-oak-deep)] !bg-[var(--brand-oak-deep)] !text-white",
                            inRange &&
                              pendingStart !== null &&
                              "!border-primary !bg-primary !text-primary-foreground"
                          )}
                        >
                          {String(slot.hour).padStart(2, "0")}:00
                          {slot.available && !inRange && slot.isPeak ? (
                            <span className="block text-xs mt-0.5 text-[var(--brand-oak-deep)]">
                              ราคาสูง
                            </span>
                          ) : null}
                        </BookingChip>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-booking-subtle">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-primary shrink-0" />
                      เลือกแล้ว
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-[var(--brand-oak-deep)] shrink-0" />
                      ช่วงราคาสูง
                    </span>
                  </div>
                  <p className="text-sm text-booking-subtle text-pretty">
                    ช่วงราคาสูงใช้เครดิตมากกว่าช่วงปกติ
                  </p>

                  {pendingStart !== null ? (
                    <button
                      type="button"
                      onClick={() => setPendingStart(null)}
                      className="booking-focus-ring mt-3 text-sm text-booking-subtle underline w-full text-center min-h-11 rounded-sm"
                    >
                      ยกเลิกการเลือกเวลา
                    </button>
                  ) : null}
                </>
              )}
            </BookingField>
            </BookingFormSection>
          ) : null}

        {bookingType === "court_with_coach" &&
          startHour !== null &&
          endHour !== null && (
            <BookingFormSection>
              <BookingField step="4" label="เลือกโค้ช">
                {loadingCoaches ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-sm bg-muted animate-pulse motion-reduce:animate-none"
                      />
                    ))}
                  </div>
                ) : coaches.length === 0 ? (
                  <BookingEmptyState
                    icon={Users}
                    title="ไม่มีโค้ชว่างในช่วงนี้"
                    description="ลองเปลี่ยนช่วงเวลา หรือจองสนามอย่างเดียวแล้วนัดโค้ชภายหลัง"
                    action={
                      <button
                        type="button"
                        onClick={() => setBookingTypeAndUrl("court_only")}
                        className="booking-focus-ring text-sm font-semibold text-primary underline-offset-2 hover:underline min-h-11 px-3 rounded-sm"
                      >
                        จองสนามอย่างเดียวแทน
                      </button>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {coaches.map((coach) => {
                      const isActive = selectedCoach?.id === coach.id;
                      const initials = coach.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <button
                          key={coach.id}
                          type="button"
                          onClick={() => setSelectedCoach(coach)}
                          aria-pressed={isActive}
                          aria-label={`เลือกโค้ช ${coach.name}`}
                          className={cn(
                            "booking-focus-ring w-full flex items-center gap-3 px-4 py-3 min-h-12 rounded-sm border text-left motion-safe-transition transition-colors motion-safe-active active:scale-[0.99]",
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
                                alt=""
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
                              <p className="text-sm text-booking-subtle truncate">
                                {coach.bio}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold tabular-nums shrink-0 text-booking-subtle">
                            +{coach.pricePerHour} เครดิต/ชม.
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </BookingField>
            </BookingFormSection>
          )}
        </BookingForm>

        <p className="text-sm text-booking-subtle leading-relaxed text-pretty">
          <span className="font-medium text-foreground">
            ยกเลิกฟรีก่อน 24 ชั่วโมง
          </span>
          {" · "}
          เครดิตคืนเข้าบัญชีทันที
        </p>
        </div>
      </div>

      <BookingStickyFooter
        summaryLines={summaryLines}
        totalCost={totalCost}
        canProceed={selectionComplete}
        hasEnoughCredits={hasEnoughCredits}
        creditShortfall={creditShortfall}
        nextStep={nextStep}
        balanceLoading={balanceLoading}
        onConfirm={handleConfirm}
        onTopUp={() => router.push("/liff/topup")}
      />
    </div>
  );
}

export default function LiffBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
