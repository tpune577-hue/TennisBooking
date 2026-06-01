"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AccessQrCard } from "@/components/access/access-qr-card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";

function AccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId") ?? "";

  if (!bookingId) {
    return (
      <p className="text-sm text-destructive text-center p-6">ไม่พบรหัสการจอง</p>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">QR เข้าสนาม</h1>
      </div>
      <div className="flex-1 p-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <AccessQrCard bookingId={bookingId} />
        </div>
      </div>
    </div>
  );
}

export default function LiffAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AccessContent />
    </Suspense>
  );
}
