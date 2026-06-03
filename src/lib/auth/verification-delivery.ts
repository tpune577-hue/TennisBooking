/** True when OTP/email codes should be logged only (no Twilio/Resend). */
export function isVerificationLogOnlyMode(): boolean {
  if (process.env.AUTH_LOG_VERIFICATION_CODES === "true") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function canSendSms(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export function canSendEmail(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
