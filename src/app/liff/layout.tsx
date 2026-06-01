import type { ReactNode } from "react";
import { LiffProvider } from "@/lib/liff/provider";
import { LiffLineSync } from "@/components/liff/liff-line-sync";

export const metadata = {
  title: "จองสนาม | Tennis Club",
};

export default function LiffLayout({ children }: { children: ReactNode }) {
  return (
    <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID ?? ""}>
      <LiffLineSync />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </div>
    </LiffProvider>
  );
}
