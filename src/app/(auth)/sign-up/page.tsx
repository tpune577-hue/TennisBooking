"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SignUpPageInner from "./sign-up-inner";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <SignUpPageInner />
    </Suspense>
  );
}
