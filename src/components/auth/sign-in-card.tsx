"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInCardProps {
  callbackUrl?: string;
  errorMessage?: string | null;
}

const DEFAULT_CALLBACK = "/liff/home";

export function SignInCard({ callbackUrl, errorMessage }: SignInCardProps) {
  const destination = callbackUrl ?? DEFAULT_CALLBACK;
  const [lineLoading, setLineLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleLineSignIn = async () => {
    setLineLoading(true);
    await signIn("line", { callbackUrl: destination });
  };

  const sendOtp = async () => {
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error ?? "ส่งรหัสไม่สำเร็จ");
        return;
      }
      setOtpSent(true);
    } catch {
      setPhoneError("ส่งรหัสไม่สำเร็จ");
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyOtp = async () => {
    setPhoneLoading(true);
    setPhoneError(null);
    const result = await signIn("phone-otp", {
      phone,
      code: otp,
      redirect: false,
    });
    setPhoneLoading(false);
    if (result?.ok) {
      window.location.href = destination;
      return;
    }
    setPhoneError("รหัสไม่ถูกต้องหรือหมดอายุ");
  };

  const sendEmailLink = async () => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl: destination }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error ?? "ส่งอีเมลไม่สำเร็จ");
        return;
      }
      setEmailSent(true);
    } catch {
      setEmailError("ส่งอีเมลไม่สำเร็จ");
    } finally {
      setEmailLoading(false);
    }
  };

  const bannerError = errorMessage ?? phoneError ?? emailError;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-heading">เข้าสู่ระบบสมาชิก</CardTitle>
        <CardDescription>
          บัญชีเดียวใช้จองคอร์ตได้ทั้งเว็บและ LINE
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {bannerError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {bannerError}
          </p>
        ) : null}

        <Button
          className="w-full bg-[#06C755] hover:bg-[#05b04c] text-white font-medium"
          size="lg"
          onClick={handleLineSignIn}
          disabled={lineLoading}
        >
          {lineLoading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย LINE"}
        </Button>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">เบอร์โทร (OTP)</p>
          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์ที่ลงทะเบียนกับสโมสร</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
            />
          </div>
          {otpSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">รหัส OTP (6 หลัก)</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                className="w-full"
                onClick={verifyOtp}
                disabled={phoneLoading || otp.length !== 6}
              >
                {phoneLoading ? "กำลังตรวจสอบ..." : "ยืนยันและเข้าสู่ระบบ"}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setPhoneError(null);
                }}
              >
                เปลี่ยนเบอร์หรือส่งรหัสใหม่
              </button>
            </>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={sendOtp}
              disabled={phoneLoading || phone.length < 8}
            >
              {phoneLoading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
            </Button>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">อีเมล</p>
          <div className="space-y-2">
            <Label htmlFor="email">อีเมลที่ลงทะเบียนกับสโมสร</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
            />
          </div>
          {emailSent ? (
            <p className="text-sm text-muted-foreground">
              ส่งลิงก์เข้าสู่ระบบแล้ว กรุณาเปิดอีเมลและคลิกลิงก์ (หมดอายุใน 30 นาที)
            </p>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={sendEmailLink}
              disabled={emailLoading || !email.includes("@")}
            >
              {emailLoading ? "กำลังส่ง..." : "ส่งลิงก์เข้าสู่ระบบ"}
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
            เงื่อนไขการใช้งาน
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
