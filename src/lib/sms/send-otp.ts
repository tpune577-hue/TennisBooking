import twilio from "twilio";
import { canSendSms, isVerificationLogOnlyMode } from "@/lib/auth/verification-delivery";

function logOtpOnly(phone: string, code: string) {
  console.info(`[auth] OTP for ${phone}: ${code} (not sent — dev/log-only mode)`);
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (isVerificationLogOnlyMode() || !canSendSms()) {
    if (process.env.NODE_ENV === "production" && !isVerificationLogOnlyMode() && !canSendSms()) {
      throw new Error(
        "ยังส่ง SMS ไม่ได้ — ตั้ง TWILIO_PHONE_NUMBER หรือ AUTH_LOG_VERIFICATION_CODES=true",
      );
    }
    logOtpOnly(phone, code);
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
    body: `รหัสเข้าสู่ระบบ Greenwich Tennis Academy: ${code} (หมดอายุใน 10 นาที)`,
  });
}
