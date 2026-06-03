"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MemberOnboardingStatus } from "@/lib/auth/member-readiness";

type Props = {
  onboarding: MemberOnboardingStatus;
};

export function MemberOnboardingChecklist({ onboarding }: Props) {
  if (onboarding.canBook) return null;

  return (
    <Link
      href="/liff/me"
      className="booking-focus-ring flex min-h-11 items-center justify-between gap-3 rounded-sm border border-border bg-[var(--brand-paper)] px-4 py-3 motion-safe-transition transition-colors hover:border-[var(--brand-oak)]"
    >
      <p className="text-sm text-foreground leading-snug text-pretty">
        ยังยืนยันข้อมูลส่วนบุคคลไม่ครบ — ไปที่แท็บ{" "}
        <span className="font-semibold text-primary">ฉัน</span> เพื่อยืนยัน
      </p>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-primary"
        aria-hidden
      />
    </Link>
  );
}
