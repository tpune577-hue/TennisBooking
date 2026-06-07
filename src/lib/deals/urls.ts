function appBase(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function dashboardDealUrl(offerId: string, action?: "pay"): string {
  const url = new URL(`/dashboard/deals/${offerId}`, appBase());
  if (action === "pay") url.searchParams.set("action", "pay");
  return url.toString();
}

export function liffDealUrl(offerId: string, action?: "pay"): string {
  const path = `/liff/deals/${offerId}${action === "pay" ? "?action=pay" : ""}`;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId) {
    const url = new URL(`https://liff.line.me/${liffId}`);
    url.searchParams.set("path", path);
    return url.toString();
  }
  return `${appBase()}${path}`;
}
