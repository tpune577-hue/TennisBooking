import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import { verifyEmailToken, verifyPhoneOtp } from "./verification";
import { loadUserForSession } from "./users";

export const authConfig: NextAuthConfig = {
  providers: [
    LINE({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
      authorization: {
        params: {
          scope: "profile openid email",
        },
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone;
        const code = credentials?.code;
        if (typeof phone !== "string" || typeof code !== "string") return null;
        try {
          const { userId } = await verifyPhoneOtp(phone, code);
          const user = await loadUserForSession(userId);
          if (!user) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: "email-token",
      name: "Email link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (typeof token !== "string") return null;
        try {
          const { userId } = await verifyEmailToken(token);
          const user = await loadUserForSession(userId);
          if (!user) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
};
