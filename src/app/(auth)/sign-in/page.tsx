"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInCard } from "@/components/auth/sign-in-card";
import { AuthEntryHub } from "@/components/auth/auth-entry-hub";
import {
  LIFF_BOOK_CALLBACK,
  parseAuthErrorParam,
  parseAuthLang,
  safeCallbackUrl,
  type SignInMethod,
} from "@/lib/marketing/member-auth-links";
import { Loader2 } from "lucide-react";

const METHODS: SignInMethod[] = ["line", "email", "phone"];

function parseMethod(value: string | null): SignInMethod | null {
  if (value && METHODS.includes(value as SignInMethod)) {
    return value as SignInMethod;
  }
  return null;
}

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const lang = parseAuthLang(searchParams.get("lang"));
  const errorMessage = parseAuthErrorParam(searchParams.get("error"));
  const methodFromQuery = useMemo(
    () => parseMethod(searchParams.get("method")),
    [searchParams],
  );
  const method: SignInMethod | null =
    methodFromQuery ?? (errorMessage ? "line" : null);

  useEffect(() => {
    if (session?.user) router.replace(callbackUrl);
  }, [session, callbackUrl, router]);

  if (status === "loading" || session?.user) {
    return (
      <main className="auth-shell">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-3)]" />
      </main>
    );
  }

  const shellClass = `marketing-site lang-${lang}`;

  if (method) {
    return (
      <div className={shellClass}>
        <main className="auth-shell">
          <SignInCard
            method={method}
            callbackUrl={callbackUrl}
            errorMessage={errorMessage}
            lang={lang}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <main className="auth-shell">
        <AuthEntryHub lang={lang} callbackUrl={callbackUrl} />
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-3)]" />
        </main>
      }
    >
      <SignInPageInner />
    </Suspense>
  );
}
