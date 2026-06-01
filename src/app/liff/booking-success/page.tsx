"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-[color:var(--chart-2)]/15 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-[color:var(--chart-2)]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">จองสำเร็จ!</h1>
        {ref && (
          <p className="text-sm text-muted-foreground">
            รหัสการจอง:{" "}
            <span className="font-mono font-semibold text-foreground">{ref}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          คุณสามารถดูรายละเอียดการจองได้ในประวัติการจอง
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button className="w-full" onClick={() => router.push("/liff/book")}>
          จองสนามอีกครั้ง
        </Button>
        <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
          ไปหน้าหลัก
        </Button>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
