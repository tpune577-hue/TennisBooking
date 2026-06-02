"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
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
      className="fixed inset-0 bg-black/55 flex items-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-t-3xl w-full max-w-[430px] mx-auto px-5 pb-10 animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto my-3" />
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
    <div className="flex flex-col min-h-screen bg-muted/30">
      <div
        className={cn(
          "w-full pt-16 pb-10 px-6 flex flex-col items-center text-center transition-all duration-500",
          "bg-gradient-to-br from-[color:var(--chart-2)] to-emerald-700",
          shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1.5">จองสำเร็จ!</h1>
        <p className="text-sm text-white/80">การจองของคุณได้รับการยืนยันแล้ว</p>
        {ref && (
          <div className="mt-3 bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white font-bold text-sm tracking-widest font-mono"># {ref}</p>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-3">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="font-bold text-sm mb-4">📋 รายละเอียดการจอง</p>
          <div className="space-y-3">
            <DetailRow label="วันที่" value={dateDisplay} />
            <DetailRow
              label="เวลา"
              value={`${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`}
            />
            <DetailRow label="สนาม" value={courtName} />
            {coachName && <DetailRow label="โค้ช" value={coachName} />}
            {total > 0 && (
              <DetailRow label="ชำระแล้ว" value={`${total} เครดิต`} highlight />
            )}
          </div>
        </div>

        {bookingId && (
          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            variant="secondary"
            onClick={() => router.push(`/liff/access?bookingId=${bookingId}`)}
          >
            <QrCode className="h-5 w-5" />
            ดู QR เข้าสนาม
          </Button>
        )}

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
        >
          <div className="bg-white/25 rounded-xl p-2.5 shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-extrabold text-base leading-tight">
              ชวนเพื่อนมาเล่นด้วยกัน
            </p>
            <p className="text-white/85 text-sm mt-0.5">สร้างลิงก์เชิญ แชร์ผ่าน LINE ได้เลย</p>
          </div>
          <span className="text-white/80 text-xl">›</span>
        </button>

        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => router.push("/liff/bookings")}
        >
          ดูการจองของฉัน
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 text-base font-semibold"
          onClick={() => router.push("/liff/book")}
        >
          จองสนามอีกครั้ง
        </Button>
      </div>

      {showInviteModal && bookingId && (
        <InviteModal
          bookingId={bookingId}
          courtName={courtName}
          date={date}
          startHour={startHour}
          coachName={coachName}
          onClose={() => setShowInviteModal(false)}
        />
      )}
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
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold",
          highlight ? "text-[color:var(--chart-2)] font-extrabold" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
