const OMISE_API = "https://api.omise.co";

function omiseHeaders() {
  const key = process.env.OMISE_SECRET_KEY!;
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${encoded}`,
  };
}

function toParams(obj: Record<string, string | number>) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export async function createPromptPaySource(amountSatang: number) {
  const res = await fetch(`${OMISE_API}/sources`, {
    method: "POST",
    headers: omiseHeaders(),
    body: toParams({ type: "promptpay", amount: amountSatang, currency: "THB" }),
  });
  if (!res.ok) throw new Error(`Omise source error: ${await res.text()}`);
  return res.json() as Promise<{
    id: string;
    type: string;
    scannable_code?: { image: { download_uri: string } };
  }>;
}

export async function createCharge(opts: {
  amount: number; // satang
  currency?: string;
  description?: string;
  sourceId?: string;
  cardToken?: string;
  metadata?: Record<string, string>;
}) {
  const params: Record<string, string | number> = {
    amount: opts.amount,
    currency: opts.currency ?? "THB",
  };
  if (opts.description) params.description = opts.description;
  if (opts.sourceId) params.source = opts.sourceId;
  if (opts.cardToken) params.card = opts.cardToken;
  if (opts.metadata) {
    Object.entries(opts.metadata).forEach(([k, v]) => {
      params[`metadata[${k}]`] = v;
    });
  }

  const res = await fetch(`${OMISE_API}/charges`, {
    method: "POST",
    headers: omiseHeaders(),
    body: toParams(params),
  });
  if (!res.ok) throw new Error(`Omise charge error: ${await res.text()}`);
  return res.json() as Promise<{
    id: string;
    status: string;
    amount: number;
    source?: { scannable_code?: { image: { download_uri: string } }; references?: { qr_code?: string } };
    failure_code?: string;
    failure_message?: string;
  }>;
}

export async function retrieveCharge(chargeId: string) {
  const res = await fetch(`${OMISE_API}/charges/${chargeId}`, {
    headers: omiseHeaders(),
  });
  if (!res.ok) throw new Error(`Omise retrieve error: ${await res.text()}`);
  return res.json() as Promise<{
    id: string;
    status: string; // pending | successful | failed | expired | reversed
    amount: number;
    metadata?: Record<string, string>;
  }>;
}

// Credit packages: THB amount → credit amount
export const CREDIT_PACKAGES = [
  { thb: 500,  credits: 500,  label: "500 บาท",  bonus: 0 },
  { thb: 1000, credits: 1100, label: "1,000 บาท", bonus: 100 },
  { thb: 2000, credits: 2400, label: "2,000 บาท", bonus: 400 },
  { thb: 5000, credits: 6000, label: "5,000 บาท", bonus: 1000 },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];
