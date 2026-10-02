// POST /api/orders/:id/mark-paid   (multipart/form-data: reference?, proof?)
// Buyer: "I've sent the money directly to the seller." No provider is involved — see the
// warning comments in money.ts / orders.ts about what DIRECT_TRANSFER does and doesn't guarantee.

import { handle, ok, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { markPaidSchema } from "@/lib/validations";
import { markBuyerPaid } from "@/lib/services/orders";
import { savePrivateImage } from "@/lib/storage";

export const POST = handle(async (req, { params }) => {
  const { profile } = await apiActiveStudent();
  const form = await req.formData();
  const { reference } = markPaidSchema.parse({ reference: form.get("reference") || undefined });

  const proofFile = form.get("proof");
  let proofKey: string | null = null;
  if (proofFile instanceof File && proofFile.size > 0) {
    proofKey = await savePrivateImage("evidence", Buffer.from(await proofFile.arrayBuffer()));
  }
  if (!reference && !proofKey) {
    throw new ApiError(400, "Add the M-Pesa confirmation code, a screenshot, or both — it's your only evidence if this is ever disputed.");
  }

  await markBuyerPaid(params.id, profile.id, { reference, proofKey });
  return ok();
});
