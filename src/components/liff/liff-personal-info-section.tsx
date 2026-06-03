"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MemberOnboardingStatus } from "@/lib/auth/member-readiness";
import { Check, Loader2 } from "lucide-react";

export type MemberFieldLocks = {
  firstName: boolean;
  lastName: boolean;
  phone: boolean;
  email: boolean;
  lineName: boolean;
};

type MeContact = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  lineDisplayName: string | null;
  fieldLocks: MemberFieldLocks;
  onboarding: MemberOnboardingStatus;
};

type FocusField = "profile" | "firstName" | "lastName" | "phone" | "email" | "line";

function displayPhone(phone: string | null) {
  if (!phone) return "";
  return phone.replace(/^\+66/, "0");
}

function FieldRow({
  id,
  label,
  locked,
  verified,
  hint,
  children,
}: {
  id: string;
  label: string;
  locked: boolean;
  verified?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="space-y-2 scroll-mt-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${id}-input`} className="text-sm font-medium">
          {label}
        </Label>
        {verified ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
            <Check className="h-3.5 w-3.5" />
            ยืนยันแล้ว
          </span>
        ) : null}
      </div>
      {children}
      {locked ? (
        <p className="text-xs text-muted-foreground">แก้ไขได้เฉพาะผู้ดูแลระบบ</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function LiffPersonalInfoSection({
  data,
  focus,
  lineNameFromLiff,
  onSaved,
}: {
  data: MeContact;
  focus: FocusField | null;
  lineNameFromLiff?: string | null;
  onSaved: () => void;
}) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState(data.firstName ?? "");
  const [lastName, setLastName] = useState(data.lastName ?? "");
  const [phone, setPhone] = useState(displayPhone(data.phone));
  const [email, setEmail] = useState(data.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const locks = data.fieldLocks;
  const { channels } = data.onboarding;

  const lineDisplay =
    lineNameFromLiff ?? data.lineDisplayName ?? "";

  useEffect(() => {
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setPhone(displayPhone(data.phone));
    setEmail(data.email ?? "");
  }, [data]);

  useEffect(() => {
    if (!focus) return;
    const targetId =
      focus === "profile"
        ? "personal-info"
        : focus === "line"
          ? "field-line"
          : `field-${focus}`;
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  function buildPayload() {
    const payload: Record<string, string> = {};
    if (!locks.firstName && firstName.trim() !== (data.firstName ?? "").trim()) {
      payload.firstName = firstName.trim();
    }
    if (!locks.lastName && lastName.trim() !== (data.lastName ?? "").trim()) {
      payload.lastName = lastName.trim();
    }
    if (!locks.phone && displayPhone(data.phone) !== phone.trim()) {
      payload.phone = phone.trim();
    }
    if (!locks.email && (data.email ?? "") !== email.trim()) {
      payload.email = email.trim();
    }
    return payload;
  }

  const hasSaveableChanges = Object.keys(buildPayload()).length > 0;

  async function save() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setSaved(true);
      onSaved();
      router.replace("/liff/me", { scroll: false });
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={sectionRef}
      id="personal-info"
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4",
        focus === "profile" && "ring-2 ring-primary/40",
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">ข้อมูลส่วนบุคคล</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          เพิ่มหรือแก้ไขได้จนกว่าจะยืนยันช่องทางนั้นแล้ว
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          บันทึกแล้ว
        </p>
      ) : null}

      <FieldRow
        id="field-firstName"
        label="ชื่อ"
        locked={locks.firstName}
        verified={data.onboarding.profileComplete}
      >
        <Input
          id="field-firstName-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          readOnly={locks.firstName}
          disabled={locks.firstName}
          autoComplete="given-name"
          className={focus === "firstName" ? "ring-2 ring-primary/40" : undefined}
        />
      </FieldRow>

      <FieldRow
        id="field-lastName"
        label="นามสกุล"
        locked={locks.lastName}
        verified={data.onboarding.profileComplete}
      >
        <Input
          id="field-lastName-input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          readOnly={locks.lastName}
          disabled={locks.lastName}
          autoComplete="family-name"
          className={focus === "lastName" ? "ring-2 ring-primary/40" : undefined}
        />
      </FieldRow>

      <FieldRow
        id="field-phone"
        label="เบอร์โทร"
        locked={locks.phone}
        verified={channels.phone.verified}
        hint={
          !channels.phone.verified && phone.trim()
            ? "ยืนยันเบอร์ด้วยการเข้าสู่ระบบ OTP"
            : !phone.trim()
              ? "เพิ่มเบอร์แล้วบันทึก"
              : undefined
        }
      >
        <Input
          id="field-phone-input"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          readOnly={locks.phone}
          disabled={locks.phone}
          autoComplete="tel"
          className={focus === "phone" ? "ring-2 ring-primary/40" : undefined}
        />
        {!channels.phone.verified && phone.trim() && !locks.phone ? (
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent("/liff/me?focus=phone")}`}
            className="text-xs font-medium text-primary underline underline-offset-2"
          >
            ไปยืนยันเบอร์ (OTP)
          </Link>
        ) : null}
      </FieldRow>

      <FieldRow
        id="field-email"
        label="Email"
        locked={locks.email}
        verified={channels.email.verified}
        hint={
          !channels.email.verified && email.trim()
            ? "ยืนยันอีเมลด้วยลิงก์จากหน้าเข้าสู่ระบบ"
            : !email.trim()
              ? "เพิ่มอีเมลแล้วบันทึก"
              : undefined
        }
      >
        <Input
          id="field-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={locks.email}
          disabled={locks.email}
          autoComplete="email"
          className={focus === "email" ? "ring-2 ring-primary/40" : undefined}
        />
        {!channels.email.verified && email.trim() && !locks.email ? (
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent("/liff/me?focus=email")}`}
            className="text-xs font-medium text-primary underline underline-offset-2"
          >
            ไปยืนยันอีเมล
          </Link>
        ) : null}
      </FieldRow>

      <FieldRow
        id="field-line"
        label="LINE Name"
        locked={locks.lineName}
        verified={channels.line.verified}
        hint={
          channels.line.verified
            ? undefined
            : "เปิดในแอป LINE เพื่อผูกบัญชี — ชื่อจะมาจากโปรไฟล์ LINE"
        }
      >
        <Input
          id="field-line-input"
          value={lineDisplay}
          readOnly
          disabled
          placeholder="ยังไม่ผูก LINE"
          className={focus === "line" ? "ring-2 ring-primary/40" : undefined}
        />
      </FieldRow>

      {!data.onboarding.profileComplete ? (
        <Link
          href={`/complete-profile?callbackUrl=${encodeURIComponent("/liff/me")}`}
          className="block text-center text-sm font-medium text-primary underline underline-offset-2"
        >
          เติมวันเกิด เพศ และข้อมูลที่จำเป็นสำหรับจอง
        </Link>
      ) : null}

      {hasSaveableChanges ? (
        <Button className="w-full" onClick={() => void save()} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              กำลังบันทึก...
            </>
          ) : (
            "บันทึกข้อมูล"
          )}
        </Button>
      ) : null}
    </div>
  );
}
