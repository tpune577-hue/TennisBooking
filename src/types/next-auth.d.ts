import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      tierId: string | null;
      creditBalance: number;
      lineUserId: string | null;
    } & DefaultSession["user"];
  }
}
