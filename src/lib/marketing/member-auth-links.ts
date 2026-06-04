/** Where members land after sign-in / sign-up from the marketing site. */
export const LIFF_HOME_CALLBACK = "/liff/home";

export const MEMBER_SIGN_IN_HREF = `/sign-in?callbackUrl=${encodeURIComponent(LIFF_HOME_CALLBACK)}`;

export const MEMBER_SIGN_UP_HREF = `/sign-up?callbackUrl=${encodeURIComponent(LIFF_HOME_CALLBACK)}`;
