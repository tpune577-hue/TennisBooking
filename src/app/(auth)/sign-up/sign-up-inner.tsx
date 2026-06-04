"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authText } from "@/lib/auth/member-auth-copy";
import {
  buildSignInHref,
  LIFF_BOOK_CALLBACK,
  parseAuthLang,
  safeCallbackUrl,
} from "@/lib/marketing/member-auth-links";
import {
  MemberProfileForm,
  type MemberProfileFormValues,
} from "@/components/auth/member-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm: MemberProfileFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
};

export default function SignUpPageInner() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const lang = parseAuthLang(searchParams.get("lang"));

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState<MemberProfileFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const submitSignup = async () => {
    if (!form.gender) {
      setError(authText(lang, "Please select gender", "กรุณาเลือกเพศ"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ??
            authText(lang, "Sign-up failed", "สมัครไม่สำเร็จ"),
        );
        return;
      }
      setStep("otp");
    } catch {
      setError(authText(lang, "Sign-up failed", "สมัครไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);
    const result = await signIn("phone-otp", {
      phone: form.phone,
      code: otp,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      window.location.href = callbackUrl;
      return;
    }
    setError(
      authText(lang, "Invalid or expired code", "รหัสไม่ถูกต้องหรือหมดอายุ"),
    );
  };

  return (
    <div className={`marketing-site lang-${lang}`}>
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-heading">
              {authText(lang, "Sign up", "สมัครสมาชิก")}
            </CardTitle>
            <CardDescription>
              {step === "form"
                ? authText(
                    lang,
                    "Complete your details, then verify your phone with OTP.",
                    "กรอกข้อมูลให้ครบ แล้วยืนยันเบอร์ด้วย OTP",
                  )
                : authText(
                    lang,
                    "Enter the 6-digit code sent to your phone.",
                    "ใส่รหัส 6 หลักที่ส่งไปยังเบอร์ของคุณ",
                  )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "form" ? (
              <MemberProfileForm
                values={form}
                onChange={setForm}
                onSubmit={submitSignup}
                submitLabel={authText(lang, "Next: verify phone", "ถัดไป: ยืนยันเบอร์")}
                loading={loading}
                error={error}
              />
            ) : (
              <>
                {error ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="otp">
                    {authText(lang, "OTP code", "รหัส OTP")}
                  </Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading
                    ? authText(lang, "Verifying…", "กำลังตรวจสอบ...")
                    : authText(lang, "Verify and sign in", "ยืนยันและเข้าสู่ระบบ")}
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground underline"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setError(null);
                  }}
                >
                  {authText(lang, "Edit sign-up details", "แก้ข้อมูลสมัคร")}
                </button>
              </>
            )}
            <p className="text-center text-xs text-muted-foreground">
              {authText(lang, "Already have an account?", "มีบัญชีแล้ว?")}{" "}
              <Link
                href={buildSignInHref({ callbackUrl, lang })}
                className="underline underline-offset-2"
              >
                {authText(lang, "Sign in", "เข้าสู่ระบบ")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
