"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MemberProfileForm,
  type MemberProfileFormValues,
} from "@/components/auth/member-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_CALLBACK = "/liff/home";

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
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState<MemberProfileFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const submitSignup = async () => {
    if (!form.gender) {
      setError("กรุณาเลือกเพศ");
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
        setError(data.error ?? "สมัครไม่สำเร็จ");
        return;
      }
      setStep("otp");
    } catch {
      setError("สมัครไม่สำเร็จ");
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
      window.location.href = DEFAULT_CALLBACK;
      return;
    }
    setError("รหัสไม่ถูกต้องหรือหมดอายุ");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-heading">สมัครสมาชิก</CardTitle>
          <CardDescription>
            {step === "form"
              ? "กรอกข้อมูลให้ครบ แล้วยืนยันเบอร์ด้วย OTP"
              : "ใส่รหัส 6 หลักที่ส่งไปยังเบอร์ของคุณ"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "form" ? (
            <MemberProfileForm
              values={form}
              onChange={setForm}
              onSubmit={submitSignup}
              submitLabel="ถัดไป: ยืนยันเบอร์"
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
                <Label htmlFor="otp">รหัส OTP</Label>
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
                {loading ? "กำลังตรวจสอบ..." : "ยืนยันและเข้าสู่ระบบ"}
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
                แก้ข้อมูลสมัคร
              </button>
            </>
          )}
          <p className="text-center text-xs text-muted-foreground">
            มีบัญชีแล้ว?{" "}
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="underline underline-offset-2"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
