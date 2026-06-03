"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Channel = "phone" | "email";

const COPY: Record<
  Channel,
  { sendLabel: string; codeLabel: string; submitLabel: string; sentHint: string }
> = {
  phone: {
    sendLabel: "ส่งรหัส OTP",
    codeLabel: "รหัสยืนยัน (6 หลัก)",
    submitLabel: "ยืนยันเบอร์โทร",
    sentHint: "ส่งรหัสไปที่เบอร์ของคุณแล้ว",
  },
  email: {
    sendLabel: "ส่งรหัสยืนยัน",
    codeLabel: "รหัสยืนยัน (6 หลัก)",
    submitLabel: "ยืนยันอีเมล",
    sentHint: "ส่งรหัสไปที่อีเมลของคุณแล้ว",
  },
};

export function LiffVerifyPanel({
  channel,
  onVerified,
}: {
  channel: Channel;
  onVerified: () => void;
}) {
  const copy = COPY[channel];
  const base = `/api/me/verify/${channel}`;
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function parseJson(res: Response): Promise<{ error?: string; devCode?: string }> {
    const text = await res.text();
    try {
      return JSON.parse(text) as { error?: string; devCode?: string };
    } catch {
      if (res.status === 401) {
        return { error: "เซสชันหมดอายุ — ออกจากระบบแล้วเข้าใหม่" };
      }
      return { error: "เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง — ลองรีเฟรชหน้า" };
    }
  }

  async function sendCode() {
    setSending(true);
    setError(null);
    setDevCode(null);
    try {
      const res = await fetch(`${base}/send`, {
        method: "POST",
        credentials: "include",
      });
      const json = await parseJson(res);
      if (!res.ok) {
        setError(json.error ?? "ส่งรหัสไม่สำเร็จ");
        return;
      }
      if (json.devCode) setDevCode(json.devCode);
      setOtpSent(true);
    } catch {
      setError("ส่งรหัสไม่สำเร็จ — ตรวจว่าเปิด URL เดียวกับที่ล็อกอิน (เช่น localhost:3001)");
    } finally {
      setSending(false);
    }
  }

  async function submitCode() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await parseJson(res);
      if (!res.ok) {
        setError(json.error ?? "ยืนยันไม่สำเร็จ");
        return;
      }
      setSuccess(true);
      onVerified();
    } catch {
      setError("ยืนยันไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
        ยืนยันสำเร็จแล้ว
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      {!otpSent ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={sending}
          onClick={() => void sendCode()}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              กำลังส่ง...
            </>
          ) : (
            copy.sendLabel
          )}
        </Button>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{copy.sentHint}</p>
          {devCode ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
              โหมดทดสอบ — รหัส: <span className="font-mono font-semibold">{devCode}</span>
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor={`verify-code-${channel}`} className="text-xs">
              {copy.codeLabel}
            </Label>
            <Input
              id={`verify-code-${channel}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={submitting || code.length !== 6}
            onClick={() => void submitCode()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังตรวจสอบ...
              </>
            ) : (
              copy.submitLabel
            )}
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground underline"
            disabled={sending}
            onClick={() => void sendCode()}
          >
            ส่งรหัสใหม่
          </button>
        </>
      )}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
