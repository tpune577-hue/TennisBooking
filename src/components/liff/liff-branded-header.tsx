"use client";

import Image from "next/image";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useCreditBalance } from "@/hooks/use-credit-balance";

export function LiffBrandedHeader() {
  const { creditBalance } = useCreditBalance();

  return (
    <header className="shrink-0 bg-brand-header backdrop-blur-md border-b border-border px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center gap-3">
      <Link
        href="/"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[var(--brand-paper)] p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="กลับหน้าเว็บไซต์ Greenwich Tennis Academy"
        title="กลับหน้าเว็บไซต์"
      >
        <Image
          src="/brand/logo.png"
          alt=""
          width={28}
          height={28}
          className="h-full w-full object-contain"
          aria-hidden
        />
      </Link>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-heading text-sm font-medium text-foreground leading-tight truncate">
          Greenwich
        </span>
        <span className="text-[10px] text-muted-foreground tracking-[0.28em] uppercase leading-tight">
          Tennis Academy
        </span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-[var(--brand-paper)] px-3 py-1.5 shrink-0">
        <Coins className="h-3.5 w-3.5 text-[var(--brand-oak-deep)]" />
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {creditBalance.toLocaleString()}
        </span>
      </div>
    </header>
  );
}
