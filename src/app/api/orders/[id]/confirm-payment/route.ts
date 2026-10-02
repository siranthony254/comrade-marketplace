// POST /api/orders/:id/confirm-payment — seller: "I checked my M-Pesa, it's there." Unlocks CONFIRM.

import { handle, ok } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { confirmPaymentReceived } from "@/lib/services/orders";

export const POST = handle(async (_req, { params }) => {
  const { profile } = await apiActiveStudent();
  await confirmPaymentReceived(params.id, profile.id);
  return ok();
});
