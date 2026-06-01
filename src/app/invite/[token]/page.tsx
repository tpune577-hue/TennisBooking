"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { formatBookingSlotTh } from "@/lib/bookings/format-slot";

type InviteInfo = {
  token: string;
  gameMode: string;
  booking: {
    ref: string;
    courtName: string;
    hostName: string;
    startTime: string;
    endTime: string;
  };
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
        setInvite(data);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [token]);

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "รับคำเชิญไม่สำเร็จ");
      setDone(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "รับคำเชิญไม่สำเร็จ");
    } finally {
      setAccepting(false);
    }
  }

  if (loadError && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-destructive">{loadError}</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slot = formatBookingSlotTh(
    new Date(invite.booking.startTime),
    new Date(invite.booking.endTime)
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">คำเชิญเล่นเทนนิส</h1>
            <p className="text-xs text-muted-foreground">จาก {invite.booking.hostName}</p>
          </div>
        </div>

        <div className="text-sm space-y-1 rounded-xl bg-muted/40 p-4 whitespace-pre-line">
          <p>
            <span className="text-muted-foreground">รหัส </span>
            <span className="font-mono font-semibold">{invite.booking.ref}</span>
          </p>
          <p>{invite.booking.courtName}</p>
          <p>{slot}</p>
          <p className="text-xs text-muted-foreground capitalize">{invite.gameMode}</p>
        </div>

        {done ? (
          <>
            <p className="text-sm text-[color:var(--chart-2)] font-medium text-center">
              รับคำเชิญแล้ว — คุณจะได้รับแจ้งเตือนหากมีการยกเลิก
            </p>
            <Button className="w-full" onClick={() => router.push("/dashboard/bookings")}>
              ไปหน้าการจองของฉัน
            </Button>
          </>
        ) : status === "unauthenticated" ? (
          <Button
            className="w-full bg-[#06C755] hover:bg-[#05b04c] text-white"
            onClick={() =>
              signIn("line", { callbackUrl: `/invite/${token}` })
            }
          >
            เข้าสู่ระบบด้วย LINE เพื่อรับคำเชิญ
          </Button>
        ) : (
          <Button className="w-full" onClick={accept} disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังยืนยัน...
              </>
            ) : (
              "รับคำเชิญ"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
