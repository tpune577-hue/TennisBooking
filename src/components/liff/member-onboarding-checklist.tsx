"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberOnboardingStatus } from "@/lib/auth/member-readiness";

type Props = {
  onboarding: MemberOnboardingStatus;
};

function ChannelRow({
  label,
  done,
  hint,
  href,
}: {
  label: string;
  done: boolean;
  hint: string;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        done ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </div>
  );

  if (href && !done) {
    return (
      <Link href={href} className="block hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}

export function MemberOnboardingChecklist({ onboarding }: Props) {
  const { channels, canBook, profileComplete, hasVerifiedChannel } = onboarding;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">คู่มือสมาชิก</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {canBook
            ? "คุณพร้อมจองคอร์ตแล้ว — ผูกช่องทางเพิ่มเพื่อรับการแจ้งเตือน"
            : !profileComplete
              ? "กรุณากรอกข้อมูลสมาชิกให้ครบก่อนจอง"
              : !hasVerifiedChannel
                ? "ยืนยันตัวตนอย่างน้อยหนึ่งช่องทางเพื่อเริ่มจอง"
                : "กำลังตรวจสอบสถานะบัญชี"}
        </p>
      </div>

      {!profileComplete ? (
        <Link
          href="/liff/me?focus=profile"
          className="block text-center text-sm font-medium text-primary underline underline-offset-2"
        >
          กรอกข้อมูลที่แท็บ ฉัน
        </Link>
      ) : null}

      <div className="space-y-2">
        <ChannelRow
          label="เบอร์โทร"
          done={channels.phone.verified}
          hint={
            channels.phone.verified
              ? "ยืนยันแล้ว"
              : channels.phone.linked
                ? "แตะเพื่อยืนยันเบอร์ที่แท็บ ฉัน"
                : "แตะเพื่อเพิ่มเบอร์ที่แท็บ ฉัน"
          }
          href={!channels.phone.verified ? "/liff/me?focus=phone" : undefined}
        />
        <ChannelRow
          label="อีเมล"
          done={channels.email.verified}
          hint={
            channels.email.verified
              ? "ยืนยันแล้ว"
              : channels.email.linked
                ? "แตะเพื่อยืนยันอีเมลที่แท็บ ฉัน"
                : "แตะเพื่อเพิ่มอีเมลที่แท็บ ฉัน"
          }
          href={!channels.email.verified ? "/liff/me?focus=email" : undefined}
        />
        <ChannelRow
          label="LINE"
          done={channels.line.verified}
          hint={
            channels.line.verified
              ? "ผูกบัญชีแล้ว"
              : "แตะเพื่อดู/ผูก LINE ที่แท็บ ฉัน"
          }
          href={!channels.line.verified ? "/liff/me?focus=line" : undefined}
        />
      </div>
    </div>
  );
}
