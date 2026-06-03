"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiffConnectionError } from "@/components/liff/liff-connection-error";
import {
  LiffPersonalInfoSection,
  type MemberFieldLocks,
} from "@/components/liff/liff-personal-info-section";
import { useLiffRequireSession } from "@/hooks/use-liff-require-session";
import type { MemberOnboardingStatus } from "@/lib/auth/member-readiness";
import {
  ChevronRight,
  ExternalLink,
  History,
  Loader2,
} from "lucide-react";

interface MeProfile {
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  tier: { name: string; discountPercent: number } | null;
  onboarding: MemberOnboardingStatus;
  fieldLocks: MemberFieldLocks;
  lineDisplayName: string | null;
}

function formatMemberSince(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

type FocusParam = "profile" | "firstName" | "lastName" | "phone" | "email" | "line" | null;

function parseFocus(raw: string | null): FocusParam {
  if (
    raw === "profile" ||
    raw === "firstName" ||
    raw === "lastName" ||
    raw === "phone" ||
    raw === "email" ||
    raw === "line"
  ) {
    return raw;
  }
  return null;
}

function LiffMePageInner() {
  const searchParams = useSearchParams();
  const focus = parseFocus(searchParams.get("focus"));
  const { data: session, status } = useSession();
  const { isReady: liffReady, isInClient, profile: liffProfile, error: liffError } =
    useLiff();
  const [profile, setProfile] = useState<MeProfile | null>(null);

  useLiffRequireSession("/liff/me");

  const loadProfile = useCallback(() => {
    if (status !== "authenticated") return;
    void fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setProfile(data as MeProfile);
      });
  }, [status]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (status === "loading" || (isInClient && !liffReady)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (liffError) {
    return <LiffConnectionError detail={liffError} />;
  }

  const displayName = profile?.name ?? session?.user?.name ?? "สมาชิก";
  const avatarUrl =
    liffProfile?.pictureUrl ??
    profile?.avatarUrl ??
    session?.user?.image ??
    undefined;
  const initials = displayName.slice(0, 2).toUpperCase();

  const menuItems = [
    {
      href: "/liff/me/credits",
      label: "ประวัติเครดิต",
      description: "ดูยอดคงเหลือและรายการเติม/ใช้",
      icon: History,
    },
    {
      href: "/dashboard",
      label: "เปิดแดชบอร์ดบนเว็บ",
      description: "สำหรับจัดการบัญชีบนคอมพิวเตอร์",
      icon: ExternalLink,
    },
  ];

  return (
    <div className="p-4 pb-6 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-3 text-lg font-bold text-foreground">{displayName}</h1>
        {profile?.tier && (
          <p className="text-sm text-muted-foreground mt-1">
            สมาชิกระดับ{" "}
            <span className="text-primary font-medium">{profile.tier.name}</span>
            {profile.tier.discountPercent > 0 &&
              ` · ส่วนลด ${profile.tier.discountPercent}%`}
          </p>
        )}
        {profile?.createdAt && (
          <p className="text-xs text-muted-foreground mt-2">
            สมาชิกตั้งแต่ {formatMemberSince(profile.createdAt)}
          </p>
        )}
      </div>

      {profile ? (
        <LiffPersonalInfoSection
          data={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            email: profile.email,
            lineDisplayName: profile.lineDisplayName,
            fieldLocks: profile.fieldLocks,
            onboarding: profile.onboarding,
          }}
          focus={focus}
          lineNameFromLiff={liffProfile?.displayName}
          onSaved={loadProfile}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function LiffMePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LiffMePageInner />
    </Suspense>
  );
}
