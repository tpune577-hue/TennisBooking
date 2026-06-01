import { getDb, schema } from "@/db";
import { asc } from "drizzle-orm";
import { CourtsPageClient } from "@/components/admin/courts/courts-page-client";

export const dynamic = "force-dynamic";

async function getCourts() {
  const db = getDb();
  return db.query.courts.findMany({
    orderBy: [asc(schema.courts.sortOrder)],
    with: { pricing: true },
  });
}

export default async function CourtsPage() {
  const courts = await getCourts();
  return <CourtsPageClient initialCourts={courts} />;
}
