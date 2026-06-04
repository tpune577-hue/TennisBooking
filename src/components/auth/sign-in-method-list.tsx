"use client";

import Link from "next/link";
import {
  authText,
} from "@/lib/auth/member-auth-copy";
import {
  buildSignInHref,
  type AuthLang,
  type SignInMethod,
} from "@/lib/marketing/member-auth-links";

type SignInMethodListProps = {
  lang: AuthLang;
  callbackUrl: string;
  /** Called when a method is chosen (e.g. close modal before navigation). */
  onSelectMethod?: () => void;
  className?: string;
};

const METHODS: { id: SignInMethod; lineClass?: string }[] = [
  { id: "line", lineClass: "btn-line" },
  { id: "email" },
  { id: "phone" },
];

function methodLabel(lang: AuthLang, id: SignInMethod): string {
  switch (id) {
    case "line":
      return authText(lang, "Log in with LINE", "เข้าสู่ระบบด้วย LINE");
    case "email":
      return authText(lang, "Log in with Email", "เข้าสู่ระบบด้วยอีเมล");
    case "phone":
      return authText(lang, "Log in with Phone number", "เข้าสู่ระบบด้วยเบอร์โทร");
  }
}

export function SignInMethodList({
  lang,
  callbackUrl,
  onSelectMethod,
  className,
}: SignInMethodListProps) {
  return (
    <div className={className}>
      <p className="auth-method-heading">
        {authText(lang, "Sign in", "เข้าสู่ระบบ")}
      </p>
      <div className="auth-method-list">
        {METHODS.map(({ id, lineClass }) => (
          <Link
            key={id}
            href={buildSignInHref({ method: id, callbackUrl, lang })}
            className={`btn w-full justify-center ${lineClass ?? "btn-ghost"}`}
            onClick={onSelectMethod}
          >
            {methodLabel(lang, id)}
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
