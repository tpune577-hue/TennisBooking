"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { BookingAuthModal } from "@/components/marketing/booking-auth-modal";
import { useMarketingLang } from "@/components/marketing/lang";
import { LIFF_BOOK_CALLBACK } from "@/lib/marketing/member-auth-links";
import { cn } from "@/lib/utils";

type BookCourtCtaProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  callbackUrl?: string;
  /** e.g. close mobile nav when opening the modal */
  onActivate?: () => void;
};

/** Opens member auth modal (Sign in / Sign up) for marketing Book CTAs. */
export function BookCourtCta({
  children,
  className,
  style,
  callbackUrl = LIFF_BOOK_CALLBACK,
  onActivate,
}: BookCourtCtaProps) {
  const { lang } = useMarketingLang();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(className)}
        style={style}
        onClick={() => {
          onActivate?.();
          setOpen(true);
        }}
      >
        {children}
      </button>
      <BookingAuthModal
        open={open}
        onOpenChange={setOpen}
        lang={lang}
        callbackUrl={callbackUrl}
      />
    </>
  );
}
