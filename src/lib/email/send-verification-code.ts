import { canSendEmail, isVerificationLogOnlyMode } from "@/lib/auth/verification-delivery";

function logEmailCodeOnly(email: string, code: string) {
  console.info(`[auth] Email verification code for ${email}: ${code} (not sent — dev/log-only mode)`);
}

export async function sendEmailVerificationCode(
  email: string,
  code: string,
): Promise<void> {
  if (isVerificationLogOnlyMode() || !canSendEmail()) {
    if (process.env.NODE_ENV === "production" && !isVerificationLogOnlyMode() && !canSendEmail()) {
      throw new Error(
        "ยังส่งอีเมลไม่ได้ — ตั้ง RESEND_API_KEY + EMAIL_FROM หรือ AUTH_LOG_VERIFICATION_CODES=true",
      );
    }
    logEmailCodeOnly(email, code);
    return;
  }

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "รหัสยืนยันอีเมล — Greenwich Tennis Academy",
        html: `<p>รหัสยืนยันของคุณคือ <strong>${code}</strong></p><p>รหัสหมดอายุใน 10 นาที</p>`,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to send email");
    }
    return;
  }

  logEmailCodeOnly(email, code);
}
