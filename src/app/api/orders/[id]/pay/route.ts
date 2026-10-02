// POST /api/orders/:id/pay — (re)send the M-Pesa prompt for an unpaid escrow order. Buyer only.
// GET  /api/orders/:id/pay — poll: checks with the provider and returns the current status.

import { handle, ok, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { initiatePayment, syncOrderPayment } from "@/lib/services/orders";

async function ownOrder(orderId: string, profileId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: profileId }, select: { id: true } });
  if (!order) throw new ApiError(404, "Order not found.");
}

export const POST = handle(async (_req, { params }) => {
  const { profile } = await apiActiveStudent();
  await ownOrder(params.id, profile.id);
  return ok(await initiatePayment(params.id));
});

export const GET = handle(async (_req, { params }) => {
  const { profile } = await apiActiveStudent();
  await ownOrder(params.id, profile.id);
  await syncOrderPayment(params.id);
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: params.id },
    select: { status: true, escrowStatus: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, failReason: true } } },
  });
  return ok({ status: order.status, escrowStatus: order.escrowStatus, lastPayment: order.payments[0] ?? null });
});
