"use client";

import Image from "next/image";
import { Coins } from "lucide-react";
import { useCreditBalance } from "@/hooks/use-credit-balance";

export function LiffBrandedHeader() {
  const { creditBalance } = useCreditBalance();

  return (
    <header className="shrink-0 bg-primary px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white/15 p-1">
        <Image
          src="/brand/logo.png"
          alt=""
          width={28}
          height={28}
          className="h-full w-full object-contain"
          aria-hidden
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-heading text-sm font-medium text-primary-foreground leading-tight truncate">
          Greenwich
        </span>
        <span className="text-[10px] text-primary-foreground/70 tracking-[0.28em] uppercase leading-tight">
          Tennis Academy
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
