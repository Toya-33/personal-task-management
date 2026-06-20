import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  await query(
    `update time_entries
     set ended_at = now(),
         duration_seconds = floor(extract(epoch from (now() - started_at)))::int
     where ended_at is null`
  );
  return NextResponse.json({ ok: true });
}
