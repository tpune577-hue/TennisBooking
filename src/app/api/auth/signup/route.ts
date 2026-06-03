import { VerificationError, createPhoneOtp } from "@/lib/auth/verification";
import { registerMember, signupBodySchema } from "@/lib/auth/signup";
import { sendOtpSms } from "@/lib/sms/send-otp";

export async function POST(req: Request) {
  const parsed = signupBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await registerMember(parsed.data);
    const { phone, code } = await createPhoneOtp(parsed.data.phone);
    await sendOtpSms(phone, code);
    return Response.json({ ok: true, phone });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "สมัครสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}
