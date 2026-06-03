"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthEntryHubProps = {
  signUpHref: string;
  onSignIn: () => void;
};

export function AuthEntryHub({ signUpHref, onSignIn }: AuthEntryHubProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-heading">ยินดีต้อนรับ</CardTitle>
        <CardDescription>เลือกสมัครสมาชิกใหม่ หรือเข้าสู่ระบบ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href={signUpHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          สมัครสมาชิก
        </Link>
        <Button className="w-full" size="lg" variant="outline" onClick={onSignIn}>
          เข้าสู่ระบบ
        </Button>
      </CardContent>
    </Card>
  );
}
