// POST /api/orders/:id/review  { rating, comment? } — buyer reviews a COMPLETED order (once).

import { handle, ok, readJson } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { reviewSchema } from "@/lib/validations";
import { submitReview } from "@/lib/services/orders";

export const POST = handle(async (req, { params }) => {
  const { profile } = await apiActiveStudent();
  await submitReview(profile.id, params.id, reviewSchema.parse(await readJson(req)));
  return ok();
});
