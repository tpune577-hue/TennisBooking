"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInMethodList } from "@/components/auth/sign-in-method-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authText } from "@/lib/auth/member-auth-copy";
import {
  buildSignUpHref,
  LIFF_BOOK_CALLBACK,
  type AuthLang,
} from "@/lib/marketing/member-auth-links";
import { cn } from "@/lib/utils";

type BookingAuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: AuthLang;
  callbackUrl?: string;
};

export function BookingAuthModal({
  open,
  onOpenChange,
  lang,
  callbackUrl = LIFF_BOOK_CALLBACK,
}: BookingAuthModalProps) {
  const [step, setStep] = useState<"entry" | "sign-in">("entry");

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setStep("entry");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("booking-auth-dialog sm:max-w-md", `marketing-site lang-${lang}`)}
        showCloseButton
      >
        {step === "entry" ? (
          <>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-heading text-xl">
                {authText(lang, "Book a court", "จองคอร์ต")}
              </DialogTitle>
              <DialogDescription>
                {authText(
                  lang,
                  "Members only. Sign in or create an account to continue.",
                  "สำหรับสมาชิกเท่านั้น เข้าสู่ระบบหรือสมัครสมาชิกเพื่อดำเนินการต่อ",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="booking-auth-actions auth-actions">
              <button
                type="button"
                className="btn btn-ghost w-full justify-center"
                onClick={() => setStep("sign-in")}
              >
                {authText(lang, "Sign in", "เข้าสู่ระบบ")}
                <span className="arrow">→</span>
              </button>
              <Link
                href={buildSignUpHref({ callbackUrl, lang })}
                className="btn btn-primary w-full justify-center"
                onClick={() => handleOpenChange(false)}
              >
                {authText(lang, "Sign up", "สมัครสมาชิก")}
                <span className="arrow">→</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-heading text-xl sr-only">
                {authText(lang, "Sign in", "เข้าสู่ระบบ")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {authText(lang, "Choose how to sign in", "เลือกวิธีเข้าสู่ระบบ")}
              </DialogDescription>
            </DialogHeader>
            <SignInMethodList
              lang={lang}
              callbackUrl={callbackUrl}
              onSelectMethod={() => handleOpenChange(false)}
              className="auth-method-list--modal"
            />
            <button
              type="button"
              className="auth-back"
              onClick={() => setStep("entry")}
            >
              ← {authText(lang, "Back", "กลับ")}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
