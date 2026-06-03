"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { useCreditBalance } from "@/hooks/use-credit-balance";
import { format, addDays, startOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookingChip,
  BookingDateSkeleton,
  BookingField,
  BookingPanel,
  BookingSlotSkeleton,
  BookingStickyFooter,
  BookingTypeToggle,
  type BookingType,
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
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        <BookingTypeToggle
          value={bookingType}
          onChange={setBookingTypeAndUrl}
        />

        <BookingPanel className="space-y-5">
          <BookingField step="1" label="เลือกวัน">
            {loadingCourts ? (
              <BookingDateSkeleton />
            ) : (
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

          <BookingField step="2" label="เลือกคอร์ต">
            {loadingCourts ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 min-w-[120px] flex-1 rounded-sm bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : courts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                ไม่พบคอร์ตที่เปิดให้จอง
              </p>
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
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                เปิด {selectedCourt.openTime} – {selectedCourt.closeTime}
                {selectedCourt.pricing ? (
                  <>
                    {" "}
                    · นอกช่วง Peak {selectedCourt.pricing.offPeakPricePerHour}{" "}
                    cr/ชม.
                  </>
                ) : null}
              </p>
            ) : null}
          </BookingField>

          {selectedCourt ? (
            <BookingField step="3" label="เลือกเวลา">
              {loadingSlots ? (
                <BookingSlotSkeleton />
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  ไม่มีช่วงเวลาว่างในวันนี้
                </p>
              ) : (
                <>
                  {timeHint ? (
                    <p
                      className="text-sm text-primary mb-2 font-medium"
                      role="status"
                    >
                      {timeHint}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-2">
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
                              Peak
                            </span>
                          ) : null}
                        </BookingChip>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-primary inline-block" />
                      เลือกแล้ว
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-[var(--brand-oak-deep)] inline-block" />
                      ช่วง Peak
                    </span>
                    <span>ช่วง Peak คิดเครดิตสูงกว่า</span>
                  </div>

                  {pendingStart !== null ? (
                    <button
                      type="button"
                      onClick={() => setPendingStart(null)}
                      className="mt-3 text-sm text-muted-foreground underline w-full text-center min-h-11"
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
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-sm bg-muted animate-pulse"
                      />
                    ))}
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
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <button
                          key={coach.id}
                          type="button"
                          onClick={() => setSelectedCoach(coach)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 min-h-11 rounded-sm border transition-colors text-left",
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
                              <p className="text-sm text-muted-foreground truncate">
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

        <p className="text-sm text-muted-foreground leading-relaxed px-0.5">
          <span className="font-medium text-foreground">
            ยกเลิกฟรีก่อน 24 ชั่วโมง
          </span>
          {" · "}
          เครดิตคืนเข้าบัญชีทันที
        </p>
      </div>

      <BookingStickyFooter
        summaryLines={summaryLines}
        totalCost={totalCost}
        canProceed={selectionComplete}
        hasEnoughCredits={hasEnoughCredits}
        creditShortfall={creditShortfall}
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
