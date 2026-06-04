"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { authText } from "@/lib/auth/member-auth-copy";
import {
  buildSignInHref,
  parseAuthLang,
  safeCallbackUrl,
} from "@/lib/marketing/member-auth-links";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = parseAuthLang(searchParams.get("lang"));
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError(authText(lang, "Invalid link", "ลิงก์ไม่ถูกต้อง"));
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

      setError(
        authText(
          lang,
          "Link expired or already used. Request a new one.",
          "ลิงก์หมดอายุหรือใช้แล้ว กรุณาขอลิงก์ใหม่",
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, callbackUrl, lang]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {authText(lang, "Confirm email", "ยืนยันอีเมล")}
        </CardTitle>
        <CardDescription>
          {error ? error : authText(lang, "Signing you in…", "กำลังเข้าสู่ระบบ...")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {!error ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Link
            href={buildSignInHref({ method: "email", callbackUrl, lang })}
            className="text-sm text-primary underline underline-offset-4"
          >
            {authText(lang, "Back to sign in", "กลับไปหน้าเข้าสู่ระบบ")}
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
