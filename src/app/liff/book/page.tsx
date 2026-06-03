"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { Loader2 } from "lucide-react";
import {
  BookingIntro,
  BookingOptionCard,
  BookingPanel,
  LiffBookingHeader,
} from "@/components/liff/booking/booking-ui";

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
        <p className="text-xs text-muted-foreground/80">{liffError}</p>
      </div>
    );
  }

  function select(type: "court_only" | "court_with_coach") {
    router.push(`/liff/book/select?type=${type}`);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <LiffBookingHeader
        title="จองคอร์ต"
        backHref="/liff"
        subtitle="เลือกรูปแบบการจอง"
      />

      <BookingIntro
        title="จองคอร์ตของคุณ"
        description="สมาชิกจองได้ในไม่ถึงนาที เลือกวัน คอร์ต และเวลา เครดิตในบัญชีจะถูกหักเมื่อยืนยัน"
      />

      <div className="flex-1 px-4 pb-6 flex flex-col gap-4">
        <BookingOptionCard
          title="จองสนามอย่างเดียว"
          description="เล่นเองหรือกับเพื่อน ไม่รวมโค้ช เหมาะสำหรับสมาชิกที่คุ้นเคยกับสนามแล้ว"
          badges={["เริ่มต้น 100 cr/ชม.", "Indoor / Outdoor"]}
          onClick={() => select("court_only")}
        />

        <BookingOptionCard
          title="จองสนามพร้อมโค้ช"
          description="มีโค้ชสอนส่วนตัวตลอดช่วงเวลาที่จอง เหมาะสำหรับผู้ที่ต้องการพัฒนาทักษะอย่างเป็นระบบ"
          badges={["ราคารวมโค้ช", "โค้ชมืออาชีพ"]}
          onClick={() => select("court_with_coach")}
          accent="recommended"
        />

        <BookingPanel className="mt-auto border-[var(--brand-oak)]/25 bg-[color-mix(in_oklch,var(--brand-paper),var(--primary)_4%)]">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">ยกเลิกฟรีก่อน 24 ชั่วโมง</span>
            <span className="text-muted-foreground">
              {" "}
              เครดิตคืนเข้าบัญชีทันที ไม่มีค่าธรรมเนียม
            </span>
          </p>
        </BookingPanel>
      </div>
    </div>
  );
}
