"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { isLiffTabPath } from "@/lib/liff/nav";
import { LiffBrandedHeader } from "@/components/liff/liff-branded-header";
import { LiffBottomNav } from "@/components/liff/liff-bottom-nav";

type LiffNavContextValue = {
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
};

const LiffNavContext = createContext<LiffNavContextValue | null>(null);

export function useLiffNavOverride() {
  const ctx = useContext(LiffNavContext);
  if (!ctx) {
    throw new Error("useLiffNavOverride must be used within LiffShell");
  }
  return ctx;
}

export function LiffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navHidden, setNavHidden] = useState(false);
  const setHideNav = useCallback((hide: boolean) => setNavHidden(hide), []);

  const isTab = isLiffTabPath(pathname);
  const showChrome = isTab && !navHidden;

  return (
    <LiffNavContext.Provider value={{ hideNav: navHidden, setHideNav }}>
      {/* h-dvh + overflow-hidden keeps tab bar pinned; min-h-screen grows with content and pushes nav off-screen */}
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-foreground">
        {showChrome && <LiffBrandedHeader />}
        <main
          className={
            showChrome
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
              : "min-h-0 flex-1 flex flex-col"
          }
        >
          {children}
        </main>
        {showChrome && <LiffBottomNav />}
      </div>
    </LiffNavContext.Provider>
  );
}
