export function isStaffRole(role: string): boolean {
  return role === "staff" || role === "super_admin";
}

export function canResetAccess(role: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(role);
}

export function verifyDeviceApiKey(authHeader: string | null): boolean {
  const expected = process.env.ACCESS_DEVICE_KEY;
  if (!expected) return false;
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === expected;
}
