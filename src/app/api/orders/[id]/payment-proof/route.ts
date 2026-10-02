// GET /api/orders/:id/payment-proof — the buyer's uploaded M-Pesa screenshot, if any.
// Viewable by the order's buyer, its seller, or an admin (e.g. while mediating a dispute).

import { NextResponse } from "next/server";
import { handle, ApiError } from "@/lib/api";
import { apiUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readPrivateImage } from "@/lib/storage";

export const GET = handle(async (_req, { params }) => {
  const user = await apiUser();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { buyerPaymentProofKey: true, buyer: { select: { userId: true } }, business: { select: { owner: { select: { userId: true } } } } },
  });
  const key = order?.buyerPaymentProofKey;
  if (!key) throw new ApiError(404, "No proof uploaded for this order.");

  const allowed = user.role === "ADMIN" || user.id === order.buyer.userId || user.id === order.business.owner.userId;
  if (!allowed) throw new ApiError(404, "Order not found."); // 404, not 403 — don't reveal the order exists

  const image = await readPrivateImage(key);
  return new NextResponse(new Uint8Array(image), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
});
