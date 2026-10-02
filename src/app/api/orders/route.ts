// POST /api/orders — place an order.
// The client sends ONLY product ids + quantities. Every price, the total, the fee and
// the payment rules are computed on the server (services/orders.ts).

import { handle, ok, readJson } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { placeOrderSchema } from "@/lib/validations";
import { placeOrder } from "@/lib/services/orders";

export const POST = handle(async (req) => {
  const { user, profile } = await apiActiveStudent();
  const input = placeOrderSchema.parse(await readJson(req));
  const { order, payment } = await placeOrder(
    { profileId: profile.id, userId: user.id, fullName: profile.fullName, email: user.email },
    input,
  );
  return ok({
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMode: order.paymentMode,
    total: order.total,
    payment, // { ok, error? } for escrow orders; null for pay-on-delivery
  });
});
