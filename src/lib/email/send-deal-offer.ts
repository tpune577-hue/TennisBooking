import { formatDealBonusPercent } from "@/lib/deals/bonus-percent";
import { dashboardDealUrl } from "@/lib/deals/urls";

export async function sendDealOfferEmail(opts: {
  email: string;
  offerId: string;
  priceThb: number;
  creditAmount: number;
  expiresAt: Date;
}): Promise<void> {
  const detailUrl = dashboardDealUrl(opts.offerId);
  const payUrl = dashboardDealUrl(opts.offerId, "pay");
  const bonus = formatDealBonusPercent(opts.priceThb, opts.creditAmount);
  const expireLabel = opts.expiresAt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#16A34A">ข้อเสนอเติมเครดิตพิเศษ</h2>
      <p>Greenwich Tennis Academy มีข้อเสนอพิเศษสำหรับคุณ</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">ราคา</td><td style="padding:8px 0"><strong>${opts.priceThb.toLocaleString()} บาท</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">เครดิตที่ได้รับ</td><td style="padding:8px 0"><strong>${opts.creditAmount.toLocaleString()} เครดิต</strong> (${bonus})</td></tr>
        <tr><td style="padding:8px 0;color:#666">หมดอายุ</td><td style="padding:8px 0">${expireLabel}</td></tr>
      </table>
      <p style="margin:24px 0 12px">
        <a href="${detailUrl}" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;margin-right:8px">ดูรายละเอียด</a>
        <a href="${payUrl}" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;text-decoration:none;border-radius:6px">ชำระเงิน</a>
      </p>
      <p style="color:#888;font-size:12px">ลิงก์นี้สำหรับบัญชีของคุณเท่านั้น — กรุณาเข้าสู่ระบบก่อนชำระเงิน</p>
    </div>
  `;

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: opts.email,
        subject: "ข้อเสนอเติมเครดิตพิเศษ — Greenwich Tennis Academy",
        html,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to send deal email");
    }
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email provider is not configured (RESEND_API_KEY, EMAIL_FROM)");
  }

  console.info(`[dev] Deal offer email for ${opts.email}: detail=${detailUrl} pay=${payUrl}`);
}
