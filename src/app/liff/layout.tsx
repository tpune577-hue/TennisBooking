import type { ReactNode } from "react";
import { LiffProvider } from "@/lib/liff/provider";

export const metadata = {
  title: "จองสนาม | Tennis Club",
};

export default function LiffLayout({ children }: { children: ReactNode }) {
  return (
    <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID ?? ""}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </div>
    </LiffProvider>
  );
}
