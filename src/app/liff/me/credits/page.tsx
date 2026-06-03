"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LiffSubpageHeader } from "@/components/liff/liff-subpage-header";
import { useLiffRequireSession } from "@/hooks/use-liff-require-session";
import { Loader2 } from "lucide-react";

const TYPE_LABELS: Record<string, { label: string }> = {
  topup: { label: "เติมเครดิต" },
  booking: { label: "จองสนาม" },
  refund: { label: "คืนเครดิต" },
  expired: { label: "หมดอายุ" },
  adjustment: { label: "ปรับยอด" },
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function LiffMeCreditsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useLiffRequireSession("/liff/me/credits");

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch("/api/me/credits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCreditBalance(data.creditBalance as number);
          setTransactions(data.transactions as Transaction[]);
        }
      })
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiffSubpageHeader title="ประวัติเครดิต" backHref="/liff/me" />

      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            คงเหลือ
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">{creditBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">เครดิต</p>
          <Link href="/liff/topup" className="block mt-3">
            <Button size="sm" className="w-full">
              เติมเครดิต
            </Button>
          </Link>
        </div>

        <h2 className="text-sm font-semibold text-foreground">ประวัติธุรกรรม</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 px-4 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">ยังไม่มีประวัติธุรกรรม</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              เติมเครดิตหรือจองสนามเพื่อเริ่มบันทึกรายการ
            </p>
            <Link href="/liff/topup">
              <Button size="sm" className="mt-2">
                เติมเครดิต
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => {
              const info = TYPE_LABELS[t.type] ?? { label: t.type };
              const isPositive = t.amount > 0;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{info.label}</span>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {t.amount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      คงเหลือ {t.balanceAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
