"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface LiffContextValue {
  isReady: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: { userId: string; displayName: string; pictureUrl?: string } | null;
  liff: typeof import("@line/liff").default | null;
  error: string | null;
}

const LiffContext = createContext<LiffContextValue>({
  isReady: false,
  isLoggedIn: false,
  isInClient: false,
  profile: null,
  liff: null,
  error: null,
});

export function LiffProvider({ liffId, children }: { liffId: string; children: ReactNode }) {
  const [state, setState] = useState<LiffContextValue>({
    isReady: false,
    isLoggedIn: false,
    isInClient: false,
    profile: null,
    liff: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!liffId) {
        if (mounted) {
          setState({
            isReady: true,
            isLoggedIn: false,
            isInClient: false,
            profile: null,
            liff: null,
            error: null,
          });
        }
        return;
      }

      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });

        if (!mounted) return;

        const inClient = liff.isInClient();

        if (!inClient) {
          setState({
            isReady: true,
            isLoggedIn: false,
            isInClient: false,
            profile: null,
            liff,
            error: null,
          });
          return;
        }

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setState({
          isReady: true,
          isLoggedIn: true,
          isInClient: true,
          profile: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          liff,
          error: null,
        });
      } catch (err) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            isReady: true,
            error:
              err instanceof Error
                ? err.message
                : "ไม่สามารถเชื่อมต่อ LINE ได้",
          }));
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [liffId]);

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  return useContext(LiffContext);
}
