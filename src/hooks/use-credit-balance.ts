"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

/**
 * Credit balance for UI — always from DB via /api/me.
 * JWT session may be stale after admin adjustments or webhooks until update().
 */
export function useCreditBalance() {
  const { data: session, status, update } = useSession();
  const sessionFallback =
    (session?.user as { creditBalance?: number } | undefined)?.creditBalance ?? 0;

  const [creditBalance, setCreditBalance] = useState(sessionFallback);
  const [loading, setLoading] = useState(status === "authenticated");

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = (await res.json()) as { creditBalance: number };
        setCreditBalance(data.creditBalance);
        await update();
      }
    } finally {
      setLoading(false);
    }
  }, [status, update]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return {
    creditBalance: status === "authenticated" ? creditBalance : sessionFallback,
    loading: loading && status === "authenticated",
    refresh,
  };
}
