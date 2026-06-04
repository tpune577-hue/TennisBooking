"use client";

import Link from "next/link";

type AuthEntryHubProps = {
  signUpHref: string;
  onSignIn: () => void;
};

export function AuthEntryHub({ signUpHref, onSignIn }: AuthEntryHubProps) {
  return (
    <article className="auth-card">
      <h1 className="title font-heading">ยินดีต้อนรับ</h1>
      <p className="lede">เลือกสมัครสมาชิกใหม่ หรือเข้าสู่ระบบ</p>
      <div className="booking-auth-actions auth-actions">
        <Link href={signUpHref} className="btn btn-primary">
          สมัครสมาชิก
          <span className="arrow">→</span>
        </Link>
        <button type="button" className="btn btn-ghost" onClick={onSignIn}>
          เข้าสู่ระบบ
          <span className="arrow">→</span>
        </button>
      </div>
    </article>
  );
}
