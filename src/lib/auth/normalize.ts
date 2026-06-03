/** Normalize Thai mobile numbers to E.164 (+66…). */
export function normalizePhoneTh(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("66") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+66${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("6") === false) {
    return `+66${digits}`;
  }

  return null;
}

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
