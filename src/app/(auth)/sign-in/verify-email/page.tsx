"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    if (!token) {
      setError("ลิงก์ไม่ถูกต้อง");
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await signIn("email-token", {
        token,
        redirect: false,
      });

      if (cancelled) return;

      if (result?.ok) {
        router.replace(callbackUrl);
        return;
      }

      setError("ลิงก์หมดอายุหรือใช้แล้ว กรุณาขอลิงก์ใหม่");
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ยืนยันอีเมล</CardTitle>
        <CardDescription>
          {error ? error : "กำลังเข้าสู่ระบบ..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {!error ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Link href="/sign-in" className="text-sm text-primary underline underline-offset-4">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-sm p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}
