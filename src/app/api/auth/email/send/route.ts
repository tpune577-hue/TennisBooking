import { z } from "zod";
import { buildEmailSignInUrl, sendMagicLinkEmail } from "@/lib/email/send-magic-link";
import { VerificationError, createEmailMagicLink } from "@/lib/auth/verification";

const bodySchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const { email, token } = await createEmailMagicLink(parsed.data.email);
    const url = buildEmailSignInUrl(token, parsed.data.callbackUrl);
    await sendMagicLinkEmail(email, url);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "ส่งอีเมลไม่สำเร็จ" }, { status: 500 });
  }
}
