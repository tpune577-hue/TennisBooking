import { auth } from "@/lib/auth";
import { sendMemberEmailOtp } from "@/lib/auth/member-verify";
import { VerificationError } from "@/lib/auth/verification";
import { sendEmailVerificationCode } from "@/lib/email/send-verification-code";
import {
  requireSessionUserId,
  verifyRouteError,
  verifySendResponse,
} from "@/lib/auth/verify-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const user = requireSessionUserId(session);
  if ("error" in user) {
    return Response.json({ error: user.error }, { status: user.status });
  }

  try {
    const { email, code } = await sendMemberEmailOtp(user.userId);
    await sendEmailVerificationCode(email, code);
    return Response.json(verifySendResponse(code));
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return verifyRouteError(err, "ส่งรหัสไม่สำเร็จ");
  }
}
