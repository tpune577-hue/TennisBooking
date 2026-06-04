"use client";

import { BookCourtCta } from "@/components/marketing/book-court-cta";
import { Bilingual, useMarketingLang } from "@/components/marketing/lang";
import { buildSignUpHref, LIFF_BOOK_CALLBACK } from "@/lib/marketing/member-auth-links";
import Link from "next/link";

export function BookingPageAuthPanel() {
  const { lang } = useMarketingLang();
  const signUpHref = buildSignUpHref({ callbackUrl: LIFF_BOOK_CALLBACK, lang });

  return (
    <div className="booking-card booking-auth-panel">
      <p className="muted" style={{ marginBottom: 0 }}>
        <Bilingual
          en="Use the same member account on the website and in LINE."
          th="ใช้บัญชีสมาชิกเดียวกันทั้งบนเว็บและใน LINE"
        />
      </p>
      <div className="booking-auth-actions">
        <BookCourtCta className="btn btn-primary">
          <Bilingual en="Sign in" th="เข้าสู่ระบบ" />
          <span className="arrow">→</span>
        </BookCourtCta>
        <Link className="btn btn-ghost" href={signUpHref}>
          <Bilingual en="Sign up" th="สมัครสมาชิก" />
          <span className="arrow">→</span>
        </Link>
      </div>
      <p className="muted" style={{ marginTop: "1.25rem", marginBottom: 0, fontSize: "0.9rem" }}>
        <Bilingual
          en="LINE · email magic link · phone OTP"
          th="LINE · ลิงก์อีเมล · OTP เบอร์โทร"
        />
      </p>
    </div>
  );
}
