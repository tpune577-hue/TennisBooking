"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useLiff } from "@/lib/liff/provider";

/** Sync LIFF profile user ID → DB so LINE Messaging API push reaches the member. */
export function LiffLineSync() {
  const { status } = useSession();
  const { isReady, isLoggedIn, profile } = useLiff();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !isReady || !isLoggedIn || !profile?.userId) return;
    if (synced.current === profile.userId) return;

    synced.current = profile.userId;
    void fetch("/api/me/line-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId: profile.userId }),
    }).catch(() => {
      synced.current = null;
    });
  }, [status, isReady, isLoggedIn, profile?.userId]);

  return null;
}
