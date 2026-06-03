export function buildEmailSignInUrl(token: string, callbackUrl?: string): string {
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL("/sign-in/verify-email", base);
  url.searchParams.set("token", token);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return url.toString();
}

export async function sendMagicLinkEmail(
  email: string,
  signInUrl: string,
): Promise<void> {
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
        subject: "เข้าสู่ระบบ Greenwich Tennis Academy",
        html: `<p>คลิกลิงก์ด้านล่างเพื่อเข้าสู่ระบบ (หมดอายุใน 30 นาที)</p><p><a href="${signInUrl}">${signInUrl}</a></p>`,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to send email");
    }
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email provider is not configured (RESEND_API_KEY, EMAIL_FROM)");
  }

  console.info(`[dev] Magic link for ${email}: ${signInUrl}`);
}
