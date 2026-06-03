"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";

/** Outside LINE app: send guests to sign-in. In LINE, LiffAuthBridge handles login. */
export function useLiffRequireSession(callbackPath: string) {
  const router = useRouter();
  const { status } = useSession();
  const { isInClient } = useLiff();

  useEffect(() => {
    if (isInClient) return;
    if (status === "unauthenticated") {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackPath)}`);
    }
  }, [isInClient, status, router, callbackPath]);
}
