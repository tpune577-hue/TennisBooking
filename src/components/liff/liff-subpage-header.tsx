"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function LiffSubpageHeader({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  return (
    <div className="shrink-0 bg-brand-header backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
      <Link
        href={backHref}
        className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
        aria-label="กลับ"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-base font-bold text-foreground">{title}</h1>
    </div>
  );
}
