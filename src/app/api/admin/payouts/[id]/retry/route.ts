// POST /api/admin/payouts/:id/retry
// Only after checking the payment provider's dashboard that the money did NOT go out.

import { handle, ok } from "@/lib/api";
import { apiAdmin } from "@/lib/session";
import { requeueFailedPayout } from "@/lib/services/orders";

export const POST = handle(async (_req, { params }) => {
  const admin = await apiAdmin();
  await requeueFailedPayout(params.id, admin.id);
  return ok();
});
