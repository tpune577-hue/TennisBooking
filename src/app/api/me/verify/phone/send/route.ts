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
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "ส่งรหัสไม่สำเร็จ" }, { status: 500 });
  }
}
