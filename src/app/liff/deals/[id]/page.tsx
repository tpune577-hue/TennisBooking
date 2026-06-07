"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { DealOfferClient } from "@/components/deals/deal-offer-client";
import { LiffSubpageHeader } from "@/components/liff/liff-subpage-header";
import { useLiffRequireSession } from "@/hooks/use-liff-require-session";

export default function LiffDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const autoPay = searchParams.get("action") === "pay";

  useLiffRequireSession(`/liff/deals/${id}${autoPay ? "?action=pay" : ""}`);

  return (
    <div className="px-4 pb-8">
      <LiffSubpageHeader title="ข้อเสนอพิเศษ" backHref="/liff/me" />
      <DealOfferClient offerId={id} autoPay={autoPay} />
    </div>
  );
}
