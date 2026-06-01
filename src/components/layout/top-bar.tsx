"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Coins, LogOut, User } from "lucide-react";

interface TopBarProps {
  user: Session["user"];
}

const ROLE_LABELS: Record<string, string> = {
  customer: "สมาชิก",
  coach_employee: "Coach",
  coach_freelance: "Coach",
  staff: "Staff",
  super_admin: "Admin",
};

export function TopBar({ user }: TopBarProps) {
  const role = (user as { role?: string }).role ?? "customer";
  const creditBalance = (user as { creditBalance?: number }).creditBalance ?? 0;
  const initials = user.name?.slice(0, 2).toUpperCase() ?? "TC";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div />

      <div className="flex items-center gap-4">
        {role === "customer" || role.startsWith("coach") ? (
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium tabular-nums">{creditBalance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit text-xs mt-1">
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/dashboard/profile"}>
              <User className="mr-2 h-4 w-4" />
              โปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
