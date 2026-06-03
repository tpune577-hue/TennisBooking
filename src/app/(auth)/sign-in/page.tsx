"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInCard } from "@/components/auth/sign-in-card";
import { AuthEntryHub } from "@/components/auth/auth-entry-hub";
import { Loader2 } from "lucide-react";

const DEFAULT_CALLBACK = "/liff/home";

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;
  const error = searchParams.get("error");
  const [view, setView] = useState<"hub" | "sign-in">("hub");

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  useEffect(() => {
    if (session?.user) router.replace(callbackUrl);
  }, [session, callbackUrl, router]);

  if (session?.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
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
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline"
            onClick={() => setView("hub")}
          >
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
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <SignInPageInner />
    </Suspense>
  );
}
