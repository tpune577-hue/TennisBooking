"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { LiffConnectionError } from "@/components/liff/liff-connection-error";
import { useLiffRequireSession } from "@/hooks/use-liff-require-session";
import {
  ChevronRight,
  LogOut,
  Mail,
  Loader2,
  FileText,
  Shield,
} from "lucide-react";
const APP_VERSION = "0.1.0";

const CONTACT_EMAIL = "info@greenwichtennis.academy";
const PRIVACY_URL = "/privacy";
const TERMS_URL = "/terms";

export default function LiffSettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isReady: liffReady, isInClient, error: liffError } = useLiff();

  useLiffRequireSession("/liff/settings");

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

  const links = [
    {
      href: `mailto:${CONTACT_EMAIL}`,
      label: "ติดต่อสโมสร",
      description: CONTACT_EMAIL,
      icon: Mail,
    },
    {
      href: PRIVACY_URL,
      label: "นโยบายความเป็นส่วนตัว",
      description: "อ่านนโยบายความเป็นส่วนตัว",
      icon: Shield,
    },
    {
      href: TERMS_URL,
      label: "ข้อกำหนดการใช้งาน",
      description: "อ่านข้อกำหนดการใช้งาน",
      icon: FileText,
    },
  ];

  return (
    <div className="p-4 pb-6 space-y-5">
      <h1 className="text-lg font-bold text-foreground">ตั้งค่า</h1>

      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <a
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
            </a>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive py-3.5 text-sm font-semibold hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        ออกจากระบบ
      </button>

      <p className="text-center text-[10px] text-muted-foreground tracking-wide">
        เวอร์ชัน {APP_VERSION}
      </p>
    </div>
  );
}
