import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { ClubAccessSettings } from "./types";

const DEFAULTS: ClubAccessSettings = {
  id: "default",
  enabled: true,
  graceMinutesBefore: 60,
  graceMinutesAfter: 60,
  maxParticipantsPerBooking: 6,
  resetAllowedRoles: ["staff", "super_admin"],
  requireResetReason: true,
};

export function maxGuestSlots(settings: ClubAccessSettings): number {
  return Math.max(0, settings.maxParticipantsPerBooking - 1);
}

export async function getClubAccessSettings(): Promise<ClubAccessSettings> {
  const db = getDb();
  const row = await db.query.clubAccessSettings.findFirst({
    where: eq(schema.clubAccessSettings.id, "default"),
  });

  if (!row) {
    await db.insert(schema.clubAccessSettings).values({ id: "default" });
    return { ...DEFAULTS };
  }

  return {
    id: row.id,
    enabled: row.enabled,
    graceMinutesBefore: row.graceMinutesBefore,
    graceMinutesAfter: row.graceMinutesAfter,
    maxParticipantsPerBooking: row.maxParticipantsPerBooking,
    resetAllowedRoles: row.resetAllowedRoles ?? DEFAULTS.resetAllowedRoles,
    requireResetReason: row.requireResetReason,
  };
}
