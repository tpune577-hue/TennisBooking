"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Credit balance for UI — from DB via /api/me.
 * Syncs JWT once; avoids session.update() loops in LIFF.
 */
export function useCreditBalance() {
  const { data: session, status, update } = useSession();
  const sessionFallback =
    (session?.user as { creditBalance?: number } | undefined)?.creditBalance ?? 0;

  const [creditBalance, setCreditBalance] = useState(sessionFallback);
  const [loading, setLoading] = useState(false);
  const jwtSynced = useRef(false);
  const fetching = useRef(false);
  const updateRef = useRef(update);
  updateRef.current = update;

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || fetching.current) return;
    fetching.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { creditBalance: number };
        setCreditBalance(data.creditBalance);
        if (!jwtSynced.current) {
          jwtSynced.current = true;
          await updateRef.current();
        }
      }
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      void refresh();
    }
  }, [status, refresh]);

  return {
    creditBalance: status === "authenticated" ? creditBalance : sessionFallback,
    loading: loading && status === "authenticated",
    refresh,
  };
}
