"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { Loader2 } from "lucide-react";

function LiffAuthBridgeInner({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInClient, isReady, isLoggedIn, error: liffError } = useLiff();
  const signInStarted = useRef(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  const callbackUrl =
    pathname +
    (searchParams.toString() ? `?${searchParams.toString()}` : "");

  useEffect(() => {
    if (!isInClient || !isReady || !isLoggedIn) return;
    if (status !== "unauthenticated") return;
    if (signInStarted.current) return;
    signInStarted.current = true;
    void signIn("line", { callbackUrl, redirect: false }).then((result) => {
      if (result?.error) {
        setBridgeError(
          "ยังไม่พบบัญชีที่ผูกกับ LINE นี้ กรุณาสมัครสมาชิกบนเว็บก่อน",
        );
        signInStarted.current = false;
        return;
      }
      if (result?.url) {
        window.location.href = result.url;
      }
    });
  }, [isInClient, isReady, isLoggedIn, status, callbackUrl]);

  if (!isInClient) {
    return <>{children}</>;
  }

  if (liffError) {
    return null;
  }

  if (!isReady || !isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังเชื่อมต่อ LINE...</p>
      </div>
    );
  }

  if (bridgeError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8 text-center max-w-sm mx-auto">
        <p className="text-sm text-destructive">{bridgeError}</p>
        <Link href="/sign-up" className="text-sm font-medium text-primary underline">
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบ...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function LiffAuthBridge({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LiffAuthBridgeInner>{children}</LiffAuthBridgeInner>
    </Suspense>
  );
}
