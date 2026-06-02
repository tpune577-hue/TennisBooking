"use client";

import { Coins } from "lucide-react";
import { useCreditBalance } from "@/hooks/use-credit-balance";

export function LiffBrandedHeader() {
  const { creditBalance } = useCreditBalance();

  return (
    <header className="shrink-0 bg-primary px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M2 14 Q10 4 18 14"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M5 14 Q10 8 15 14"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <line
            x1="10"
            y1="7"
            x2="10"
            y2="14"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-primary-foreground leading-tight truncate">
          Greenwich Tennis
        </span>
        <span className="text-[10px] text-primary-foreground/60 tracking-wider uppercase leading-tight">
          Academy
        </span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 shrink-0">
        <Coins className="h-3.5 w-3.5 text-primary-foreground" />
        <span className="text-sm font-semibold tabular-nums text-primary-foreground">
          {creditBalance.toLocaleString()}
        </span>
      </div>
    </header>
  );
}
