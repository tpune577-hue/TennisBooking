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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {showChrome && <LiffBrandedHeader />}
        <main
          className={
            showChrome
              ? "flex-1 overflow-y-auto overscroll-contain"
              : "flex-1 flex flex-col min-h-0"
          }
        >
          {children}
        </main>
        {showChrome && <LiffBottomNav />}
      </div>
    </LiffNavContext.Provider>
  );
}
