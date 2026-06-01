"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function LiffBookPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isReady: liffReady, error: liffError } = useLiff();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/book");
    }
  }, [status, router]);

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

  function select(type: "court_only" | "court_with_coach") {
    router.push(`/liff/book/select?type=${type}`);
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">เลือกประเภทการจอง</h1>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground text-center">
          เลือกรูปแบบการจองที่ต้องการ
        </p>

        {/* Court Only */}
        <button
          onClick={() => select("court_only")}
          className="w-full bg-card border-2 border-border rounded-2xl p-6 text-left transition-all hover:border-primary/50 hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <span className="text-5xl leading-none select-none">🎾</span>
            <div className="flex-1">
              <p className="font-extrabold text-lg text-foreground mb-1.5">จองสนามอย่างเดียว</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                เล่นเองหรือกับเพื่อน ไม่รวมโค้ช เหมาะสำหรับผู้ที่มีประสบการณ์แล้ว
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)] text-xs font-semibold px-3 py-1 rounded-full">
                  ราคาเริ่มต้น 100 cr/ชม.
                </span>
                <span className="bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Indoor / Outdoor
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Court + Coach */}
        <button
          onClick={() => select("court_with_coach")}
          className="w-full bg-card border-2 border-border rounded-2xl p-6 text-left transition-all hover:border-amber-400/60 hover:shadow-sm active:scale-[0.99] relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            แนะนำ
          </div>
          <div className="flex items-start gap-4">
            <span className="text-5xl leading-none select-none">👨‍🏫</span>
            <div className="flex-1">
              <p className="font-extrabold text-lg text-foreground mb-1.5">จองสนาม + โค้ช</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                พร้อมโค้ชสอนส่วนตัว เพิ่มทักษะเทนนิสอย่างมีประสิทธิภาพ
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  ราคารวมโค้ช
                </span>
                <span className="bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  โค้ชมืออาชีพ
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Cancel note */}
        <div className="bg-[color:var(--chart-2)]/8 border border-[color:var(--chart-2)]/25 rounded-2xl p-4 mt-auto">
          <p className="text-sm text-[color:var(--chart-2)] leading-relaxed">
            ✅ <strong>ยกเลิกได้ฟรีก่อน 24 ชั่วโมง</strong> — เครดิตจะคืนเข้าบัญชีทันที ไม่มีค่าธรรมเนียม
          </p>
        </div>
      </div>
    </div>
  );
}
