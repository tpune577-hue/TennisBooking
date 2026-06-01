import { getDb, schema } from "./index";

const db = getDb();

async function seed() {
  console.log("🌱 Seeding database...");

  // Tiers
  const [regularTier, silverTier, goldTier, coachTier] = await db
    .insert(schema.tiers)
    .values([
      {
        name: "Regular",
        description: "สมาชิกทั่วไป",
        maxSlots: 9999,
        discountPercent: 0,
        advanceBookingDays: 7,
        maxBookingsPerDay: 2,
        maxHoursPerBooking: 3,
        sortOrder: 1,
      },
      {
        name: "Silver",
        description: "สมาชิก Silver",
        maxSlots: 50,
        discountPercent: 10,
        advanceBookingDays: 14,
        maxBookingsPerDay: 3,
        maxHoursPerBooking: 3,
        sortOrder: 2,
      },
      {
        name: "Gold",
        description: "สมาชิก Gold",
        maxSlots: 20,
        discountPercent: 15,
        advanceBookingDays: 21,
        maxBookingsPerDay: 4,
        maxHoursPerBooking: 4,
        sortOrder: 3,
      },
      {
        name: "Coach",
        description: "Tier สำหรับ Coach Freelance",
        maxSlots: 30,
        discountPercent: 20,
        advanceBookingDays: 30,
        maxBookingsPerDay: 6,
        maxHoursPerBooking: 6,
        sortOrder: 4,
      },
    ])
    .returning();

  console.log("✅ Tiers created");

  // Packages
  await db.insert(schema.packages).values([
    {
      name: "Silver 1 เดือน",
      description: "สมาชิก Silver 30 วัน",
      tierId: silverTier.id,
      durationDays: 30,
      price: 49900,
      bonusCredit: 100,
      sortOrder: 1,
    },
    {
      name: "Silver 3 เดือน",
      description: "สมาชิก Silver 90 วัน",
      tierId: silverTier.id,
      durationDays: 90,
      price: 129900,
      bonusCredit: 300,
      sortOrder: 2,
    },
    {
      name: "Gold 1 เดือน",
      description: "สมาชิก Gold 30 วัน",
      tierId: goldTier.id,
      durationDays: 30,
      price: 89900,
      bonusCredit: 200,
      sortOrder: 3,
    },
    {
      name: "Coach Tier 1 เดือน",
      description: "Coach Tier 30 วัน",
      tierId: coachTier.id,
      durationDays: 30,
      price: 149900,
      bonusCredit: 500,
      sortOrder: 4,
    },
  ]);

  console.log("✅ Packages created");

  // Courts
  const courts = await db
    .insert(schema.courts)
    .values([
      { name: "Outdoor A", type: "outdoor", sortOrder: 1 },
      { name: "Outdoor B", type: "outdoor", sortOrder: 2 },
      { name: "Indoor 1", type: "indoor", sortOrder: 3 },
      { name: "Indoor 2", type: "indoor", sortOrder: 4 },
      { name: "Indoor 3", type: "indoor", sortOrder: 5 },
      { name: "Indoor 4", type: "indoor", sortOrder: 6 },
      { name: "Clay Court", type: "clay", sortOrder: 7 },
    ])
    .returning();

  console.log("✅ Courts created");

  // Court pricing (mock-up prices)
  const pricingMap: Record<string, { peak: number; offPeak: number }> = {
    outdoor: { peak: 200, offPeak: 150 },
    indoor: { peak: 250, offPeak: 180 },
    clay: { peak: 300, offPeak: 220 },
  };

  await db.insert(schema.courtPricing).values(
    courts.map((court) => ({
      courtId: court.id,
      peakPricePerHour: pricingMap[court.type].peak,
      offPeakPricePerHour: pricingMap[court.type].offPeak,
    }))
  );

  console.log("✅ Court pricing created");

  // Super Admin user
  await db.insert(schema.users).values({
    name: "Super Admin",
    email: "admin@tennisclub.com",
    role: "super_admin",
    tierId: regularTier.id,
    isEmailVerified: true,
    isPhoneVerified: true,
  });

  console.log("✅ Super Admin created");
  console.log("🎉 Seed completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
