export function dealBonusPercent(priceThb: number, creditAmount: number): number {
  if (priceThb <= 0) return 0;
  return Math.round(((creditAmount - priceThb) / priceThb) * 100);
}

export function formatDealBonusPercent(priceThb: number, creditAmount: number): string {
  const pct = dealBonusPercent(priceThb, creditAmount);
  if (pct <= 0) return "0%";
  return `+${pct}%`;
}
