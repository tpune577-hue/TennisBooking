import type { ReactNode } from "react";
import { LiffProvider } from "@/lib/liff/provider";
import { LiffLineSync } from "@/components/liff/liff-line-sync";
import { LiffShell } from "@/components/liff/liff-shell";

export const metadata = {
  title: "Greenwich Tennis | LINE",
};

export default function LiffLayout({ children }: { children: ReactNode }) {
  return (
    <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID ?? ""}>
      <LiffLineSync />
      <LiffShell>{children}</LiffShell>
    </LiffProvider>
  );
}
