// GET /api/cron/maintenance — reconcile payments/payouts, expire unpaid orders, auto-release delivered ones.
// Call every ~5 minutes with:  Authorization: Bearer $CRON_SECRET
// (Vercel Cron sends this header automatically when CRON_SECRET is set; Hobby plans only allow
// daily crons, so on Hobby use an external pinger such as cron-job.org.)

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runMaintenance } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const authorised = Boolean(secret) && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!authorised) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({ ok: true, ...(await runMaintenance()) });
}
