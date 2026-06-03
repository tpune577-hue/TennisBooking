import twilio from "twilio";

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Twilio is not configured");
    }
    console.info(`[dev] OTP for ${phone}: ${code}`);
    return;
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from,
    to: phone,
    body: `รหัสเข้าสู่ระบบ Greenwich Tennis Academy: ${code} (หมดอายุใน 10 นาที)`,
  });
}
