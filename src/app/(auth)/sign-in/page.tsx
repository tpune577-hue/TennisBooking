import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInCard } from "@/components/auth/sign-in-card";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignInCard callbackUrl={callbackUrl} />
    </main>
  );
}
