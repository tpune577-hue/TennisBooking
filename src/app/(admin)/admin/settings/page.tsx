import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database, Bell, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const role = (session.user as { role?: string }).role ?? "customer";
  if (role !== "super_admin") redirect("/admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">ตั้งค่า</h1>
        <p className="text-sm text-muted-foreground mt-1">การตั้งค่าระบบสำหรับ Super Admin</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">ฐานข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">จัดการ seed data, backup (เร็วๆ นี้)</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">การแจ้งเตือน</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">ตั้งค่า LINE Notify, webhook (เร็วๆ นี้)</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">ความปลอดภัย</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">สิทธิ์การเข้าถึง, 2FA (เร็วๆ นี้)</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">ทั่วไป</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">ชื่อระบบ, เวลาทำการ, นโยบาย (เร็วๆ นี้)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
