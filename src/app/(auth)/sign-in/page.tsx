"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInCard } from "@/components/auth/sign-in-card";
import { AuthEntryHub } from "@/components/auth/auth-entry-hub";
import { LIFF_HOME_CALLBACK } from "@/lib/marketing/member-auth-links";
import { Loader2 } from "lucide-react";

const DEFAULT_CALLBACK = LIFF_HOME_CALLBACK;

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;
  const error = searchParams.get("error");
  // OAuth errors need the sign-in form (LINE / OTP) with the message visible.
  const [view, setView] = useState<"hub" | "sign-in">(error ? "sign-in" : "hub");

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

  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="auth-shell">
      {view === "hub" ? (
        <AuthEntryHub
          signUpHref={signUpHref}
          onSignIn={() => setView("sign-in")}
        />
      ) : (
        <div className="w-full max-w-md space-y-3">
          <SignInCard
            callbackUrl={callbackUrl}
            errorMessage={error ? decodeURIComponent(error) : null}
          />
          <button type="button" className="auth-back" onClick={() => setView("hub")}>
            ← กลับไปเลือกสมัคร / เข้าสู่ระบบ
          </button>
        </div>
      )}
    </main>
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
