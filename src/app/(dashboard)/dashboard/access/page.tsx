"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AccessQrCard } from "@/components/access/access-qr-card";
import { Loader2, ArrowLeft } from "lucide-react";

function AccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";

  if (!bookingId) {
    return <p className="text-destructive text-sm">ระบุ bookingId ใน URL</p>;
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center text-sm border border-border rounded-md px-3 py-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          กลับ
        </Link>
        <h1 className="text-2xl font-semibold">QR เข้าสนาม</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <AccessQrCard bookingId={bookingId} />
      </div>
    </div>
  );
}

export default function DashboardAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AccessContent />
    </Suspense>
  );
}
