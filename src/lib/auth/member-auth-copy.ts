import type { AuthLang } from "@/lib/marketing/member-auth-links";

export function authText(lang: AuthLang, en: string, th: string): string {
  return lang === "th" ? th : en;
}
