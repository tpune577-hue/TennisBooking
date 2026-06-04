"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authText } from "@/lib/auth/member-auth-copy";
import {
  buildSignInHref,
  LIFF_BOOK_CALLBACK,
  type AuthLang,
  type SignInMethod,
} from "@/lib/marketing/member-auth-links";

interface SignInCardProps {
  method: SignInMethod;
  callbackUrl?: string;
  errorMessage?: string | null;
  lang: AuthLang;
}

export function SignInCard({
  method,
  callbackUrl,
  errorMessage,
  lang,
}: SignInCardProps) {
  const destination = callbackUrl ?? LIFF_BOOK_CALLBACK;
  const hubHref = buildSignInHref({ callbackUrl: destination, lang });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-heading">
          {authText(lang, "Member sign in", "เข้าสู่ระบบสมาชิก")}
        </CardTitle>
        <CardDescription>
          {authText(
            lang,
            "One account for booking on the web and in LINE.",
            "บัญชีเดียวใช้จองคอร์ตได้ทั้งเว็บและ LINE",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {method === "line" ? (
          <LineSignIn
            destination={destination}
            errorMessage={errorMessage}
            lang={lang}
          />
        ) : null}
        {method === "phone" ? (
          <PhoneSignIn
            destination={destination}
            errorMessage={errorMessage}
            lang={lang}
          />
        ) : null}
        {method === "email" ? (
          <EmailSignIn
            destination={destination}
            errorMessage={errorMessage}
            lang={lang}
          />
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          {authText(lang, "By signing in you agree to our", "การเข้าสู่ระบบถือว่าคุณยอมรับ")}{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
            {authText(lang, "Terms of Service", "เงื่อนไขการใช้งาน")}
          </a>
        </p>

        <Link href={hubHref} className="auth-back block text-center">
          ← {authText(lang, "Other sign-in options", "วิธีเข้าสู่ระบบอื่น")}
        </Link>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

function LineSignIn({
  destination,
  errorMessage,
  lang,
}: {
  destination: string;
  errorMessage?: string | null;
  lang: AuthLang;
}) {
  const [lineLoading, setLineLoading] = useState(false);

  const handleLineSignIn = async () => {
    setLineLoading(true);
    await signIn("line", { callbackUrl: destination });
  };

  return (
    <>
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      <Button
        className="w-full bg-[#06C755] hover:bg-[#05b04c] text-white font-medium"
        size="lg"
        onClick={handleLineSignIn}
        disabled={lineLoading}
      >
        {lineLoading
          ? authText(lang, "Connecting…", "กำลังเชื่อมต่อ...")
          : authText(lang, "Log in with LINE", "เข้าสู่ระบบด้วย LINE")}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {authText(
          lang,
          "You will be redirected to LINE to authorize.",
          "ระบบจะพาไปยืนยันตัวตนที่ LINE",
        )}
      </p>
    </>
  );
}

function PhoneSignIn({
  destination,
  errorMessage,
  lang,
}: {
  destination: string;
  errorMessage?: string | null;
  lang: AuthLang;
}) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const bannerError = errorMessage ?? phoneError;

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
        setPhoneError(data.error ?? authText(lang, "Could not send code", "ส่งรหัสไม่สำเร็จ"));
        return;
      }
      setOtpSent(true);
    } catch {
      setPhoneError(authText(lang, "Could not send code", "ส่งรหัสไม่สำเร็จ"));
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
    setPhoneError(
      authText(lang, "Invalid or expired code", "รหัสไม่ถูกต้องหรือหมดอายุ"),
    );
  };

  if (!otpSent) {
    return (
      <>
        {bannerError ? <ErrorBanner message={bannerError} /> : null}
        <div className="space-y-2">
          <Label htmlFor="phone">
            {authText(lang, "Phone registered with the club", "เบอร์ที่ลงทะเบียนกับสโมสร")}
          </Label>
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
        <Button
          className="w-full"
          onClick={sendOtp}
          disabled={phoneLoading || phone.length < 8}
        >
          {phoneLoading
            ? authText(lang, "Sending…", "กำลังส่ง...")
            : authText(lang, "Send OTP", "ส่งรหัส OTP")}
        </Button>
      </>
    );
  }

  return (
    <>
      {bannerError ? <ErrorBanner message={bannerError} /> : null}
      <p className="text-sm text-muted-foreground">
        {authText(lang, "Enter verification code", "ใส่รหัสยืนยัน")} — {phone}
      </p>
      <div className="space-y-2">
        <Label htmlFor="otp">{authText(lang, "OTP (6 digits)", "รหัส OTP (6 หลัก)")}</Label>
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
        {phoneLoading
          ? authText(lang, "Verifying…", "กำลังตรวจสอบ...")
          : authText(lang, "Verify and sign in", "ยืนยันและเข้าสู่ระบบ")}
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
        {authText(lang, "Change number or resend", "เปลี่ยนเบอร์หรือส่งรหัสใหม่")}
      </button>
    </>
  );
}

function EmailSignIn({
  destination,
  errorMessage,
  lang,
}: {
  destination: string;
  errorMessage?: string | null;
  lang: AuthLang;
}) {
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const bannerError = errorMessage ?? emailError;

  const sendEmailLink = async () => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl: destination, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error ?? authText(lang, "Could not send email", "ส่งอีเมลไม่สำเร็จ"));
        return;
      }
      setEmailSent(true);
    } catch {
      setEmailError(authText(lang, "Could not send email", "ส่งอีเมลไม่สำเร็จ"));
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
      {bannerError ? <ErrorBanner message={bannerError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">
          {authText(lang, "Email registered with the club", "อีเมลที่ลงทะเบียนกับสโมสร")}
        </Label>
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
          {authText(
            lang,
            "Sign-in link sent. Open your email (expires in 30 minutes).",
            "ส่งลิงก์เข้าสู่ระบบแล้ว กรุณาเปิดอีเมล (หมดอายุใน 30 นาที)",
          )}
        </p>
      ) : (
        <Button
          className="w-full"
          variant="outline"
          onClick={sendEmailLink}
          disabled={emailLoading || !email.includes("@")}
        >
          {emailLoading
            ? authText(lang, "Sending…", "กำลังส่ง...")
            : authText(lang, "Send sign-in link", "ส่งลิงก์เข้าสู่ระบบ")}
        </Button>
      )}
    </>
  );
}
