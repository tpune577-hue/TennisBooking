import { z } from "zod";
import { VerificationError, createPhoneOtp } from "@/lib/auth/verification";
import { sendOtpSms } from "@/lib/sms/send-otp";

const bodySchema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "เบอร์โทรไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const { phone, code } = await createPhoneOtp(parsed.data.phone);
    await sendOtpSms(phone, code);
    return Response.json({ ok: true, phone });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "ส่งรหัสไม่สำเร็จ" }, { status: 500 });
  }
}
