"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { useCreditBalance } from "@/hooks/use-credit-balance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiffConnectionError } from "@/components/liff/liff-connection-error";
import { CalendarDays, ChevronRight, Loader2, Wallet } from "lucide-react";

interface UpcomingBooking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  totalCreditCost: number;
  type: string;
  court: { name: string };
}

function formatDate(s: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(s));
}

function formatTime(s: string) {
  const d = new Date(s);
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

export default function LiffHomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady, error: liffError } = useLiff();
  const { creditBalance } = useCreditBalance();
  const [nextBooking, setNextBooking] = useState<UpcomingBooking | null>(null);
  const [profileTier, setProfileTier] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/home");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      const [bookingsRes, meRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/me", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const me = (await meRes.json()) as { tier?: { name: string } | null };
        setProfileTier(me.tier?.name ?? null);
      }
      if (bookingsRes.ok) {
        const bookings = (await bookingsRes.json()) as UpcomingBooking[];
        const now = Date.now();
        const upcoming = bookings
          .filter((b) => b.status === "confirmed" && new Date(b.startTime).getTime() >= now)
          .sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        setNextBooking(upcoming[0] ?? null);
      }
    })();
  }, [status]);

  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (liffError) {
    return <LiffConnectionError detail={liffError} />;
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "สมาชิก";

  return (
    <div className="p-4 pb-6 space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          สวัสดี, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profileTier ? (
            <>
              สมาชิกระดับ{" "}
              <span className="text-primary font-medium">{profileTier}</span>
            </>
          ) : (
            "ยินดีต้อนรับสู่ Greenwich Tennis Academy"
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              เครดิตคงเหลือ
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums mt-1">
              {creditBalance.toLocaleString()}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <Link href="/liff/topup" className="block mt-4">
          <Button variant="outline" size="sm" className="w-full">
            เติมเครดิต
          </Button>
        </Link>
      </div>

      {nextBooking ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">การจองถัดไป</p>
            <Link
              href="/liff/bookings"
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              ดูทั้งหมด
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground">{nextBooking.court.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(nextBooking.startTime)} · {formatTime(nextBooking.startTime)}–
                {formatTime(nextBooking.endTime)}
              </p>
              <Badge variant="outline" className="mt-2 text-xs">
                {nextBooking.totalCreditCost} เครดิต
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-1">
          <p className="text-sm font-medium text-foreground">ยังไม่มีการจองถัดไป</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            กดจองคอร์ตด้านล่างเพื่อเลือกวัน เวลา และคอร์ต
          </p>
        </div>
      )}

      <Link href="/liff/book" className="block">
        <Button className="w-full h-12 rounded-sm text-sm font-semibold tracking-wide uppercase">
          จองคอร์ต
        </Button>
      </Link>
    </div>
  );
}
