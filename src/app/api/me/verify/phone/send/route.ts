import { auth } from "@/lib/auth";
import { sendMemberPhoneOtp } from "@/lib/auth/member-verify";
import { VerificationError } from "@/lib/auth/verification";
import { sendOtpSms } from "@/lib/sms/send-otp";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone, code } = await sendMemberPhoneOtp(session.user.id);
    await sendOtpSms(phone, code);
    const body: { ok: true; devCode?: string } = { ok: true };
    if (process.env.AUTH_LOG_VERIFICATION_CODES === "true") {
      body.devCode = code;
    }
    return Response.json(body);
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "ส่งรหัสไม่สำเร็จ" }, { status: 500 });
  }
}
