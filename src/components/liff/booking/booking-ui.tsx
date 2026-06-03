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
    <header className="shrink-0 border-b border-border bg-brand-header backdrop-blur-md px-4 py-3.5 flex items-center gap-3">
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

export function BookingForm({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-card divide-y divide-border shadow-[0_1px_2px_oklch(0.22_0.02_75_/_0.05)]">
      {children}
    </div>
  );
}

export function BookingFormSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-4 py-5", className)}>{children}</div>;
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
    <section className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm font-semibold text-[var(--brand-oak-deep)] leading-snug">
        {step != null ? `${step} · ` : ""}
        {label}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
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
        variant === "slot" &&
          "min-h-11 py-2.5 text-center text-sm tabular-nums",
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

export type BookingType = "court_only" | "court_with_coach";

export function BookingTypeToggle({
  value,
  onChange,
}: {
  value: BookingType;
  onChange: (type: BookingType) => void;
}) {
  const options: { id: BookingType; label: string }[] = [
    { id: "court_only", label: "จองสนามอย่างเดียว" },
    { id: "court_with_coach", label: "จองพร้อมโค้ช" },
  ];

  return (
    <div
      className="flex rounded-sm border border-border p-1 bg-[var(--brand-paper)]"
      role="group"
      aria-label="รูปแบบการจอง"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 min-h-11 px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-200",
              active
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function BookingStickyFooter({
  summaryLines,
  totalCost,
  canProceed,
  hasEnoughCredits,
  creditShortfall,
  onConfirm,
  onTopUp,
}: {
  summaryLines: { label: string; value: string }[];
  totalCost: number;
  canProceed: boolean;
  hasEnoughCredits: boolean;
  creditShortfall: number;
  onConfirm: () => void;
  onTopUp: () => void;
}) {
  const showTotal = canProceed && totalCost > 0;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-brand-header backdrop-blur-md px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] space-y-3">
      {summaryLines.length > 0 ? (
        <div
          className="rounded-sm bg-[var(--brand-ink)] text-white px-4 py-3 text-sm space-y-1.5"
          aria-live="polite"
        >
          {summaryLines.map((line) => (
            <div key={line.label} className="flex justify-between gap-3">
              <span className="text-[oklch(0.72_0.02_85)]">{line.label}</span>
              <span className="font-medium text-right tabular-nums">{line.value}</span>
            </div>
          ))}
          {showTotal ? (
            <div className="flex justify-between gap-3 pt-1.5 border-t border-white/10">
              <span className="text-[oklch(0.72_0.02_85)]">รวม</span>
              <span className="font-heading text-lg tabular-nums">
                {totalCost.toLocaleString()} cr
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {canProceed && !hasEnoughCredits ? (
        <div className="rounded-sm border border-destructive/30 bg-destructive/8 px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive font-medium">
            เครดิตไม่พอ · ขาด {creditShortfall.toLocaleString()} cr
          </p>
          <button
            type="button"
            onClick={onTopUp}
            className="text-sm font-semibold text-primary shrink-0 underline-offset-2 hover:underline"
          >
            เติมเครดิต
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!canProceed || !hasEnoughCredits}
        className={cn(
          "w-full min-h-12 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors",
          canProceed && hasEnoughCredits
            ? "btn-brand"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {canProceed && hasEnoughCredits
          ? `ยืนยันการจอง · ${totalCost.toLocaleString()} เครดิต`
          : canProceed
            ? "เติมเครดิตก่อนจอง"
            : "เลือกให้ครบก่อน"}
      </button>
    </div>
  );
}

export function BookingDateSkeleton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[62px] h-[72px] rounded-sm bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

export function BookingSlotSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-11 rounded-sm bg-muted animate-pulse" />
      ))}
    </div>
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
