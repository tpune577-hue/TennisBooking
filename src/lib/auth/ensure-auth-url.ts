/**
 * On Vercel preview, force AUTH_URL to this deployment's host so OAuth state cookies
 * and LINE redirect_uri match the URL users actually open.
 * (A static AUTH_URL pointing at production breaks preview LINE login.)
 */
export function ensureAuthUrl(): void {
  if (process.env.VERCEL_ENV !== "preview" || !process.env.VERCEL_URL) return;
  process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
}
