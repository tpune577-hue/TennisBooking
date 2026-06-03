import twilio from "twilio";

/** Log OTP to server logs only — no SMS charge. Set AUTH_LOG_VERIFICATION_CODES=true */
function logOtpOnly(phone: string, code: string) {
  console.info(`[auth] OTP for ${phone}: ${code} (not sent — AUTH_LOG_VERIFICATION_CODES or dev mode)`);
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.AUTH_LOG_VERIFICATION_CODES === "true") {
    logOtpOnly(phone, code);
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Twilio is not configured");
    }
    logOtpOnly(phone, code);
    return;
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from,
    to: phone,
    body: `รหัสเข้าสู่ระบบ Greenwich Tennis Academy: ${code} (หมดอายุใน 10 นาที)`,
  });
}
