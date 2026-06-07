"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Trophy,
  Package,
  Tag,
  UserCheck,
  Wallet,
  Settings,
  CreditCard,
  ScanLine,
  QrCode,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["customer", "coach_employee", "coach_freelance", "staff", "super_admin"],
  },
  {
    href: "/dashboard/bookings",
    label: "การจองของฉัน",
    icon: CalendarDays,
    roles: ["customer", "coach_employee", "coach_freelance"],
  },
  {
    href: "/dashboard/credits",
    label: "เครดิตของฉัน",
    icon: Wallet,
    roles: ["customer", "coach_employee", "coach_freelance"],
  },
  {
    href: "/dashboard/topup",
    label: "เติมเครดิต",
    icon: CreditCard,
    roles: ["customer", "coach_employee", "coach_freelance"],
  },
  {
    href: "/admin/bookings",
    label: "จัดการการจอง",
    icon: CalendarDays,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/members",
    label: "สมาชิก",
    icon: Users,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/deals",
    label: "Deal",
    icon: Tag,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/courts",
    label: "สนาม",
    icon: Trophy,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/packages",
    label: "Package",
    icon: Package,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/coaches",
    label: "Coach",
    icon: UserCheck,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/finance",
    label: "การเงิน",
    icon: Wallet,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/access/scan",
    label: "สแกน QR",
    icon: ScanLine,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/access/settings",
    label: "ตั้งค่า QR",
    icon: QrCode,
    roles: ["staff", "super_admin"],
  },
  {
    href: "/admin/settings",
    label: "ตั้งค่า",
    icon: Settings,
    roles: ["super_admin"],
  },
];

interface SidebarNavProps {
  role: string;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">

      {/* Court blue header band — the "คาด" */}
      <div className="bg-primary px-5 py-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M2 14 Q10 4 18 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M5 14 Q10 8 15 14" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
            <line x1="10" y1="7" x2="10" y2="14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white leading-tight truncate">
            Greenwich Tennis
          </span>
          <span className="text-[10px] text-white/60 tracking-wider uppercase leading-tight">
            Academy
          </span>
        </div>
      </div>

      {/* Navigation — warm wood */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/12 text-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-sidebar-foreground/50"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer brand mark */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/35 uppercase tracking-widest">
          NIWA PRIVATO
        </p>
      </div>
    </aside>
  );
}
