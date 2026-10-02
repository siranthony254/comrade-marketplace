// POST /api/webhooks/payments — payment provider callback.
//
// Security: (1) the request must carry the shared secret (verifyWebhook), then
// (2) we IGNORE whatever state the body claims and ask the provider directly. A forged
// or replayed webhook therefore cannot mark an order as paid.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { settlePayment } from "@/lib/services/orders";

export async function POST(req: Request) {
  const raw = await req.text();
  const provider = getPaymentProvider();

  const event = provider.verifyWebhook(raw, req.headers);
  if (!event) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await prisma.webhookEvent.create({ data: { provider: provider.name, eventKey: event.eventKey, payload: JSON.parse(raw) as Prisma.InputJsonValue } });
  } catch (e) {
    // Provider retry of an event we already handled -> acknowledge, do nothing.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const seen = await prisma.webhookEvent.findUnique({ where: { eventKey: event.eventKey } });
      if (seen?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
    } else {
      throw e;
    }
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { providerRef: event.providerRef } });
    if (payment && payment.status === "PENDING") {
      const s = await provider.getPaymentStatus(event.providerRef);
      if (s.state !== "PENDING") await settlePayment(payment.id, s.state, s.failReason);
    }
    await prisma.webhookEvent.update({ where: { eventKey: event.eventKey }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook] processing failed", e);
    return NextResponse.json({ ok: false }, { status: 500 }); // non-2xx makes the provider retry
  }
}
