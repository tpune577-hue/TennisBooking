"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, CheckCheck, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Invite Modal ────────────────────────────────────────────────────────────

type GameMode = "singles" | "doubles";

type InviteModalProps = {
  bookingRef: string;
  courtName: string;
  date: string;
  startHour: number;
  coachName?: string | null;
  onClose: () => void;
};

function InviteModal({
  bookingRef,
  courtName,
  date,
  startHour,
  coachName,
  onClose,
}: InviteModalProps) {
  const [gameMode, setGameMode] = useState<GameMode>("singles");
  const [step, setStep] = useState<"select" | "share">("select");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const maxPlayers = gameMode === "singles" ? 2 : 4;
  const slotsLeft = maxPlayers - 1;

  const inviteLink =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/invite/${token}`
      : "";

  function handleCreate() {
    const t = `${bookingRef}-${Math.random().toString(36).slice(2, 8)}`;
    setToken(t);
    setStep("share");
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLineShare() {
    const dateDisplay = date
      ? format(new Date(date + "T12:00:00"), "EEE d MMM", { locale: th })
      : "";
    const timeStr = `${String(startHour).padStart(2, "0")}:00 น.`;
    const text =
      `🎾 เชิญมาเล่นเทนนิสด้วยกัน!\n` +
      `${courtName} · ${dateDisplay} เวลา ${timeStr}\n` +
      (coachName ? `โค้ช: ${coachName}\n` : "") +
      `\nกดรับคำเชิญ: ${inviteLink}`;
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/55 flex items-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-t-3xl w-full max-w-[430px] mx-auto px-5 pb-10 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-1 bg-border rounded-full mx-auto my-3" />

        {step === "select" ? (
          <>
            <h2 className="text-lg font-black mb-1">ชวนเพื่อนมาเล่น</h2>
            <p className="text-sm text-muted-foreground mb-5">
              เลือกรูปแบบการเล่น แล้วสร้างลิงก์เชิญ
            </p>

            <div className="flex gap-3 mb-5">
              {(["singles", "doubles"] as GameMode[]).map((mode) => {
                const isActive = gameMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={cn(
                      "flex-1 py-4 px-3 rounded-2xl border-2 transition-all text-center",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="text-3xl mb-1.5 select-none">
                      {mode === "singles" ? "🧑‍🤝‍🧑" : "👥"}
                    </div>
                    <p
                      className={cn(
                        "font-black text-sm mb-0.5",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {mode === "singles" ? "Singles" : "Doubles"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mode === "singles" ? "1 vs 1 · 2 คน" : "2 vs 2 · 4 คน"}
                    </p>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleCreate}
            >
              สร้างลิงก์เชิญ
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black mb-1">ลิงก์พร้อมแล้ว!</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {gameMode === "singles" ? "Singles" : "Doubles"} ·{" "}
              รอเพื่อนอีก {slotsLeft} คน · หมดอายุเมื่อถึงเวลาจอง
            </p>

            {/* Link preview */}
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2.5 border border-border mb-4">
              <span className="flex-1 text-xs text-muted-foreground font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {inviteLink}
              </span>
              <button
                onClick={handleCopy}
                className={cn(
                  "shrink-0 transition-colors",
                  copied ? "text-[color:var(--chart-2)]" : "text-muted-foreground"
                )}
              >
                {copied ? <CheckCheck className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
              </button>
            </div>

            <button
              onClick={handleCopy}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all mb-2",
                copied
                  ? "border-[color:var(--chart-2)] text-[color:var(--chart-2)]"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              {copied ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}
            </button>

            <button
              onClick={handleLineShare}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#06C755] text-white font-black text-base mb-2"
            >
              <span className="text-xl select-none">💚</span>
              แชร์ผ่าน LINE
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors"
            >
              ปิด
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Success Content ─────────────────────────────────────────────────────────

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Green gradient hero */}
      <div
        className={cn(
          "w-full pt-16 pb-10 px-6 flex flex-col items-center text-center transition-all duration-500",
          "bg-gradient-to-br from-[color:var(--chart-2)] to-emerald-700",
          shown
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        )}
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1.5">จองสำเร็จ!</h1>
        <p className="text-sm text-white/80">การจองของคุณได้รับการยืนยันแล้ว</p>
        {ref && (
          <div className="mt-3 bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white font-bold text-sm tracking-widest font-mono">
              # {ref}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-3">
        {/* Booking details */}
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
              <DetailRow
                label="ชำระแล้ว"
                value={`${total} เครดิต`}
                highlight
              />
            )}
          </div>
        </div>

        {/* Invite friends banner */}
        <button
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
            <p className="text-white/85 text-sm mt-0.5">
              สร้างลิงก์เชิญ แชร์ผ่าน LINE ได้เลย
            </p>
          </div>
          <span className="text-white/80 text-xl">›</span>
        </button>

        {/* Actions */}
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => router.push("/dashboard")}
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

      {showInviteModal && (
        <InviteModal
          bookingRef={ref}
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
          highlight
            ? "text-[color:var(--chart-2)] font-extrabold"
            : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
