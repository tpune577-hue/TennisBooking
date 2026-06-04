/** Default landing after member auth from marketing / Book CTA. */
export const LIFF_BOOK_CALLBACK = "/liff/book";

/** LIFF member hub (not used for marketing callback after grill). */
export const LIFF_HOME_CALLBACK = "/liff/home";

export type SignInMethod = "line" | "email" | "phone";

export type AuthLang = "en" | "th";

export function parseAuthLang(value: string | null | undefined): AuthLang {
  return value === "th" ? "th" : "en";
}

export function buildSignInHref(options?: {
  method?: SignInMethod;
  callbackUrl?: string;
  lang?: AuthLang;
}): string {
  const params = new URLSearchParams();
  params.set("callbackUrl", options?.callbackUrl ?? LIFF_BOOK_CALLBACK);
  if (options?.method) params.set("method", options.method);
  if (options?.lang) params.set("lang", options.lang);
  return `/sign-in?${params.toString()}`;
}

export function buildSignUpHref(options?: {
  callbackUrl?: string;
  lang?: AuthLang;
}): string {
  const params = new URLSearchParams();
  params.set("callbackUrl", options?.callbackUrl ?? LIFF_BOOK_CALLBACK);
  if (options?.lang) params.set("lang", options.lang);
  return `/sign-up?${params.toString()}`;
}

/** Sign-in hub (no method) — full page entry. */
export const MEMBER_SIGN_IN_HREF = buildSignInHref();

export const MEMBER_SIGN_UP_HREF = buildSignUpHref();

/** Reject off-site callbackUrl values (open-redirect hardening). */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = LIFF_BOOK_CALLBACK,
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return fallback;
  }
  return raw;
}

export function parseAuthErrorParam(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
