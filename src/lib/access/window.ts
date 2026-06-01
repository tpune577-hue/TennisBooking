import type { ClubAccessSettings, AccessWindow } from "./types";

export function getAccessWindow(
  booking: { startTime: Date; endTime: Date },
  settings: Pick<ClubAccessSettings, "graceMinutesBefore" | "graceMinutesAfter">,
  now = new Date()
): AccessWindow {
  const validFrom = new Date(
    booking.startTime.getTime() - settings.graceMinutesBefore * 60_000
  );
  const validUntil = new Date(
    booking.endTime.getTime() + settings.graceMinutesAfter * 60_000
  );

  let phase: AccessWindow["phase"] = "active";
  if (now < validFrom) phase = "before";
  else if (now > validUntil) phase = "after";

  return { validFrom, validUntil, now, phase };
}

export function formatAccessWindowTh(window: AccessWindow): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  return `${fmt(window.validFrom)} – ${fmt(window.validUntil)}`;
}
