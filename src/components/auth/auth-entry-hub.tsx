"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInMethodList } from "@/components/auth/sign-in-method-list";
import { authText } from "@/lib/auth/member-auth-copy";
import { buildSignUpHref, type AuthLang } from "@/lib/marketing/member-auth-links";

type AuthEntryHubProps = {
  lang: AuthLang;
  callbackUrl: string;
};

export function AuthEntryHub({ lang, callbackUrl }: AuthEntryHubProps) {
  const [step, setStep] = useState<"entry" | "sign-in">("entry");
  const signUpHref = buildSignUpHref({ callbackUrl, lang });

  return (
    <article className="auth-card">
      <h1 className="title font-heading">
        {authText(lang, "Welcome", "ยินดีต้อนรับ")}
      </h1>
      <p className="lede">
        {authText(
          lang,
          "Sign up for a new account or sign in to book.",
          "เลือกสมัครสมาชิกใหม่ หรือเข้าสู่ระบบเพื่อจองคอร์ต",
        )}
      </p>

      {step === "entry" ? (
        <div className="booking-auth-actions auth-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep("sign-in")}
          >
            {authText(lang, "Sign in", "เข้าสู่ระบบ")}
            <span className="arrow">→</span>
          </button>
          <Link href={signUpHref} className="btn btn-primary">
            {authText(lang, "Sign up", "สมัครสมาชิก")}
            <span className="arrow">→</span>
          </Link>
        </div>
      ) : (
        <>
          <SignInMethodList
            lang={lang}
            callbackUrl={callbackUrl}
            className="auth-method-block"
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
    </article>
  );
}
