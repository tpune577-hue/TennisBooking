/** Shared copy when LINE LIFF fails to initialize (member-facing, Thai). */
export function LiffConnectionError({ detail }: { detail?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2 p-8 text-center max-w-sm mx-auto">
      <p className="text-sm font-medium text-foreground">เปิดจาก LINE ไม่สำเร็จ</p>
      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
        ปิดหน้านี้แล้วเปิดลิงก์จากแชท LINE ของสโมสรอีกครั้ง
      </p>
      {detail ? (
        <p className="text-xs text-muted-foreground/80 mt-2 break-words">{detail}</p>
      ) : null}
    </div>
  );
}
