"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, QrCode, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingPanel } from "@/components/liff/booking/booking-ui";
import { BookingPartyPanel } from "@/components/access/booking-party-panel";

function InviteModal({
  bookingId,
  courtName,
  date,
  startHour,
  coachName,
  onClose,
}: {
  bookingId: string;
  courtName: string;
  date: string;
  startHour: number;
  coachName?: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-[var(--brand-ink)]/55 flex items-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-t-sm w-full max-w-[430px] mx-auto px-5 pb-10 animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-0.5 bg-border rounded-full mx-auto my-3" />
        <BookingPartyPanel
          bookingId={bookingId}
          courtName={courtName}
          date={date}
          startHour={startHour}
          coachName={coachName}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const bookingId = searchParams.get("bookingId") ?? "";
  const ref = searchParams.get("ref") ?? "";
  const courtName = searchParams.get("courtName") ?? "";
  const date = searchParams.get("date") ?? "";
  const startHour = parseInt(searchParams.get("startHour") ?? "0");
  const endHour = parseInt(searchParams.get("endHour") ?? "0");
  const coachName = searchParams.get("coachName");
  const total = parseInt(searchParams.get("total") ?? "0");

  const dateDisplay = date
    ? format(new Date(date + "T12:00:00"), "EEEE d MMMM yyyy", { locale: th })
    : "";

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (searchParams.get("invite") === "1" && bookingId) {
      setShowInviteModal(true);
    }
  }, [searchParams, bookingId]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div
        className={cn(
          "w-full pt-16 pb-10 px-6 flex flex-col items-center text-center transition-[opacity,transform] duration-500 ease-out",
          "bg-primary",
          shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        )}
      >
        <div className="w-16 h-16 rounded-sm bg-white/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-9 w-9 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-medium text-primary-foreground mb-1">
          จองสำเร็จ
        </h1>
        <p className="text-sm text-primary-foreground/85">
          การยืนยันจะส่งถึงคุณผ่าน LINE ทันที
        </p>
        {ref ? (
          <div className="mt-4 bg-white/12 rounded-sm px-4 py-2 border border-white/20">
            <p className="text-primary-foreground font-mono text-sm font-semibold tracking-wider">
              {ref}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 p-4 space-y-3">
        <BookingPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-oak-deep)] mb-3">
            รายละเอียดการจอง
          </p>
          <dl className="space-y-3 text-sm">
            <DetailRow label="วันที่" value={dateDisplay} />
            <DetailRow
              label="เวลา"
              value={`${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`}
            />
            <DetailRow label="คอร์ต" value={courtName} />
            {coachName ? <DetailRow label="โค้ช" value={coachName} /> : null}
            {total > 0 ? (
              <DetailRow
                label="ชำระแล้ว"
                value={`${total.toLocaleString()} เครดิต`}
                highlight
              />
            ) : null}
          </dl>
        </BookingPanel>

        {bookingId ? (
          <Button
            variant="outline"
            className="w-full h-12 rounded-sm text-sm font-semibold gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={() => router.push(`/liff/access?bookingId=${bookingId}`)}
          >
            <QrCode className="h-5 w-5" />
            ดู QR เข้าสนาม
          </Button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="w-full flex items-center gap-4 p-4 rounded-sm text-left border border-[var(--brand-oak)] bg-[color-mix(in_oklch,var(--brand-paper),var(--brand-oak)_12%)] transition-transform active:scale-[0.995]"
        >
          <div className="bg-[var(--brand-oak)]/20 rounded-sm p-2.5 shrink-0">
            <Users className="h-5 w-5 text-[var(--brand-oak-deep)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-tight">
              ชวนเพื่อนมาเล่นด้วยกัน
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              สร้างลิงก์เชิญและแชร์ผ่าน LINE
            </p>
          </div>
        </button>

        <Button
          className="w-full h-12 rounded-sm btn-brand text-sm font-semibold tracking-wide uppercase"
          onClick={() => router.push("/liff/bookings")}
        >
          ดูการจองของฉัน
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 rounded-sm text-sm font-semibold"
          onClick={() => router.push("/liff/book")}
        >
          จองคอร์ตอีกครั้ง
        </Button>
      </div>

      {showInviteModal && bookingId ? (
        <InviteModal
          bookingId={bookingId}
          courtName={courtName}
          date={date}
          startHour={startHour}
          coachName={coachName}
          onClose={() => setShowInviteModal(false)}
        />
      ) : null}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-semibold text-right",
          highlight ? "text-primary tabular-nums" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
