// POST /api/dev/simulate-payment  { orderId, result: "SUCCEEDED" | "FAILED" }
// DEV ONLY (mock provider): stands in for the buyer entering their M-Pesa PIN.
// Returns 404 in production and whenever a real provider is configured.

import { z } from "zod";
import { NextResponse } from "next/server";
import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { mockControl } from "@/lib/payments/mock";
import { getPaymentProvider } from "@/lib/payments";
import { syncOrderPayment } from "@/lib/services/orders";

export const POST = handle(async (req) => {
  if (process.env.NODE_ENV === "production" || getPaymentProvider().name !== "mock") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const { profile } = await apiActiveStudent();
  const { orderId, result } = z.object({ orderId: z.string(), result: z.enum(["SUCCEEDED", "FAILED"]) }).parse(await readJson(req));

  const payment = await prisma.payment.findFirst({
    where: { orderId, status: "PENDING", providerRef: { not: null }, order: { buyerId: profile.id } },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) throw new ApiError(404, "No pending payment to simulate.");

  mockControl.settle(payment.providerRef!, result);
  await syncOrderPayment(orderId);
  return ok();
});
