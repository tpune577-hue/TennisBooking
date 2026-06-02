"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LIFF_TAB_PATHS, type LiffTabPath } from "@/lib/liff/nav";

const NAV_ITEMS: {
  href: LiffTabPath;
  label: string;
  icon: typeof Home;
}[] = [
  { href: "/liff/home", label: "Home", icon: Home },
  { href: "/liff/me", label: "Me", icon: User },
  { href: "/liff/bookings", label: "Booking", icon: CalendarDays },
  { href: "/liff/topup", label: "Top up", icon: Wallet },
  { href: "/liff/settings", label: "Settings", icon: Settings },
];

export function LiffBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1 min-w-0">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] rounded-lg transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className={cn("text-[10px] leading-tight", active && "font-semibold")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
