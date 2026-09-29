import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function ensureSpecialCareSequence() {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS special_care_case_seq START 1000`);
}
