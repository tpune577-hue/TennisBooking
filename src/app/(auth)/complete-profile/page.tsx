"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MemberProfileForm,
  type MemberProfileFormValues,
} from "@/components/auth/member-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const DEFAULT_CALLBACK = "/liff/home";

function CompleteProfileInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;

  const [form, setForm] = useState<MemberProfileFormValues>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent("/complete-profile")}`,
      );
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const me = (await res.json()) as {
          firstName?: string | null;
          lastName?: string | null;
          phone?: string | null;
          email?: string | null;
          dateOfBirth?: string | null;
          gender?: string | null;
          name?: string;
        };
        const parts = me.name?.trim().split(/\s+/) ?? [];
        setForm({
          firstName: me.firstName ?? parts[0] ?? "",
          lastName: me.lastName ?? parts.slice(1).join(" ") ?? "",
          phone: me.phone?.replace(/^\+66/, "0") ?? "",
          email: me.email ?? "",
          dateOfBirth:
            typeof me.dateOfBirth === "string"
              ? me.dateOfBirth.slice(0, 10)
              : "",
          gender: (me.gender as MemberProfileFormValues["gender"]) ?? "",
        });
      } finally {
        setBootLoading(false);
      }
    })();
  }, [status]);

  const submit = async () => {
    if (!form.gender) {
      setError("กรุณาเลือกเพศ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || bootLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-heading">ข้อมูลสมาชิก</CardTitle>
          <CardDescription>
            กรุณากรอกข้อมูลให้ครบก่อนใช้งานจองคอร์ตและบริการอื่นๆ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberProfileForm
            values={form}
            onChange={setForm}
            onSubmit={submit}
            submitLabel="บันทึกและดำเนินการต่อ"
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>
    </main>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <CompleteProfileInner />
    </Suspense>
  );
}
