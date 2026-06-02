/** Routes that show the LIFF tab bar + branded header */
export const LIFF_TAB_PATHS = [
  "/liff/home",
  "/liff/me",
  "/liff/bookings",
  "/liff/topup",
  "/liff/settings",
] as const;

export type LiffTabPath = (typeof LIFF_TAB_PATHS)[number];

export function isLiffTabPath(pathname: string): pathname is LiffTabPath {
  return (LIFF_TAB_PATHS as readonly string[]).includes(pathname);
}
