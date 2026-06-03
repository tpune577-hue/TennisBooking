"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import { Loader2 } from "lucide-react";

function LiffAuthBridgeInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const hasUser = Boolean(session?.user);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInClient, isReady, isLoggedIn, error: liffError } = useLiff();

  const callbackUrl =
    pathname +
    (searchParams.toString() ? `?${searchParams.toString()}` : "");

  useEffect(() => {
    if (!isInClient || !isReady || !isLoggedIn) return;
    if (status !== "unauthenticated") return;
    router.replace(
      `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }, [isInClient, isReady, isLoggedIn, status, callbackUrl, router]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังเชื่อมต่อ LINE...</p>
      </div>
    );
  }

  if (!isInClient) {
    return <>{children}</>;
  }

  if (liffError) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังเชื่อมต่อ LINE...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังเปิดหน้าเข้าสู่ระบบ...</p>
      </div>
    );
  }

  if (status === "loading" && !hasUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
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
