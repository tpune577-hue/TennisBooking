import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Package</h1>
        <p className="text-sm text-muted-foreground mt-1">จัดการ Package สมาชิก</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-20 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium">หน้านี้อยู่ระหว่างพัฒนา</p>
        <p className="text-xs text-muted-foreground mt-1">Package management จะพร้อมใช้งานเร็วๆ นี้</p>
      </div>
    </div>
  );
}
