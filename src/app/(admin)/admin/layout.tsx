import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const role = (session.user as { role?: string }).role ?? "customer";
  if (role !== "super_admin" && role !== "staff") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 bg-background/60">
          {children}
        </main>
      </div>
    </div>
  );
}
