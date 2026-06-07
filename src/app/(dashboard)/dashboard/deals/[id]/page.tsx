"use client";

import { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DealOfferClient } from "@/components/deals/deal-offer-client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function DashboardDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoPay = searchParams.get("action") === "pay";

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push("/dashboard")}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        กลับ
      </Button>
      <h1 className="text-2xl font-semibold">ข้อเสนอเติมเครดิตพิเศษ</h1>
      <DealOfferClient offerId={id} autoPay={autoPay} />
    </div>
  );
}
