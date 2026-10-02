// POST /api/orders/:id/action  { action, reason?, description? }
// Buyer and seller both use this; the server decides which role the caller has for THIS order.

import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { orderActionSchema } from "@/lib/validations";
import { applyOrderAction } from "@/lib/services/orders";

export const POST = handle(async (req, { params }) => {
  const { profile } = await apiActiveStudent();
  const body = orderActionSchema.parse(await readJson(req));

  const o = await prisma.order.findUnique({ where: { id: params.id }, select: { buyerId: true, business: { select: { ownerId: true } } } });
  const kind = !o ? null : o.buyerId === profile.id ? "BUYER" : o.business.ownerId === profile.id ? "SELLER" : null;
  if (!kind) throw new ApiError(404, "Order not found.");

  const order = await applyOrderAction(params.id, { kind, profileId: profile.id }, body.action, { reason: body.reason, description: body.description });
  return ok({ status: order.status, escrowStatus: order.escrowStatus });
});
