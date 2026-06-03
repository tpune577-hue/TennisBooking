"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiffBookingHeader({
  title,
  subtitle,
  backHref,
  onBack,
  creditBalance,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  creditBalance?: number;
}) {
  const backControl =
    backHref != null ? (
      <Link
        href={backHref}
        className="p-1.5 -ml-1 rounded-sm hover:bg-[color-mix(in_oklch,var(--brand-paper),var(--foreground)_6%)] transition-colors"
        aria-label="กลับ"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
    ) : onBack != null ? (
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 -ml-1 rounded-sm hover:bg-[color-mix(in_oklch,var(--brand-paper),var(--foreground)_6%)] transition-colors"
        aria-label="กลับ"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    ) : null;

  return (
    <header className="shrink-0 border-b border-border bg-card px-4 py-3.5 flex items-center gap-3">
      {backControl}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-base font-medium text-foreground leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {creditBalance != null ? (
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-oak-deep)]">
            เครดิต
          </p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {creditBalance.toLocaleString()}
          </p>
        </div>
      ) : null}
    </header>
  );
}

export function BookingIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-4 pt-5 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-oak-deep)] mb-2 flex items-center gap-2">
        <span className="h-px w-5 bg-[var(--brand-oak)]" aria-hidden="true" />
        จองคอร์ต
      </p>
      <h2 className="font-heading text-2xl font-medium text-foreground text-balance leading-[1.08]">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[60ch]">
        {description}
      </p>
    </div>
  );
}

export function BookingField({
  step,
  label,
  children,
  className,
}: {
  step?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-oak-deep)]">
        {step != null ? `${step} · ` : ""}
        {label}
      </p>
      {children}
    </section>
  );
}

export function BookingChip({
  pressed,
  disabled,
  onClick,
  children,
  className,
  variant = "default",
}: {
  pressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "date" | "slot";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "font-medium transition-[background,border-color,color,opacity] duration-200 ease-out",
        "border rounded-sm text-left",
        variant === "date" &&
          "min-w-[62px] flex flex-col items-center gap-0.5 py-2.5 px-2 text-center",
        variant === "slot" && "py-2.5 text-center text-sm tabular-nums",
        variant === "default" && "py-2.5 px-4 text-sm",
        disabled &&
          "opacity-35 cursor-not-allowed line-through border-border/60 bg-muted/20 text-muted-foreground",
        !disabled &&
          !pressed &&
          "border-border bg-[var(--brand-paper)] text-muted-foreground hover:border-[var(--brand-oak)] hover:text-foreground",
        !disabled &&
          pressed &&
          "border-primary bg-primary text-primary-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function BookingPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-sm p-4 shadow-[0_1px_2px_oklch(0.22_0.02_75_/_0.05),0_8px_24px_-16px_oklch(0.22_0.02_75_/_0.18)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BookingSummary({
  title = "การจองของคุณ",
  rows,
  totalLabel = "เครดิต",
  totalValue,
  action,
  note,
  className,
}: {
  title?: string;
  rows: { label: string; value: string }[];
  totalLabel?: string;
  totalValue: string;
  action?: React.ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-sm bg-[var(--brand-ink)] text-[oklch(0.93_0.012_85)] p-5",
        className
      )}
    >
      <h3 className="font-heading text-lg font-medium text-white mb-4">{title}</h3>
      <dl className="space-y-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-3 py-3 border-b border-white/10 text-sm"
          >
            <dt className="text-[oklch(0.72_0.02_85)]">{row.label}</dt>
            <dd className="text-white text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between items-baseline gap-3 mt-4 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.72_0.02_85)]">
          {totalLabel}
        </span>
        <span className="font-heading text-2xl text-white tabular-nums">{totalValue}</span>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
      {note ? (
        <p className="text-xs text-[oklch(0.62_0.02_85)] text-center mt-3 leading-relaxed">
          {note}
        </p>
      ) : null}
    </aside>
  );
}

export function BookingOptionCard({
  title,
  description,
  badges,
  onClick,
  accent,
}: {
  title: string;
  description: string;
  badges: string[];
  onClick: () => void;
  accent?: "recommended";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left border rounded-sm p-5 transition-[border-color,box-shadow,transform] duration-200 ease-out",
        "bg-card hover:border-[var(--brand-oak)] active:scale-[0.995]",
        accent === "recommended"
          ? "border-[var(--brand-oak)] shadow-[0_1px_2px_oklch(0.22_0.02_75_/_0.06)]"
          : "border-border"
      )}
    >
      {accent === "recommended" ? (
        <span className="inline-block mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-oak-deep)] border border-[var(--brand-oak)]/40 px-2 py-0.5 rounded-sm">
          แนะนำสำหรับผู้เริ่มต้น
        </span>
      ) : null}
      <p className="font-heading text-lg font-medium text-foreground mb-1.5">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className="text-xs font-medium px-2.5 py-1 rounded-sm border border-border bg-[var(--brand-paper)] text-muted-foreground"
          >
            {badge}
          </span>
        ))}
      </div>
    </button>
  );
}

export function BookingBrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={36}
      height={36}
      className={cn("object-contain", className)}
      aria-hidden
    />
  );
}
