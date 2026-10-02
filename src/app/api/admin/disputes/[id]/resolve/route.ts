// POST /api/admin/disputes/:id/resolve  { outcome: "BUYER" | "SELLER", note }

import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { apiAdmin } from "@/lib/session";
import { resolveDispute } from "@/lib/services/orders";

const schema = z.object({ outcome: z.enum(["BUYER", "SELLER"]), note: z.string().trim().min(5, "Explain your decision.").max(500) });

export const POST = handle(async (req, { params }) => {
  const admin = await apiAdmin();
  const { outcome, note } = schema.parse(await readJson(req));
  await resolveDispute(params.id, admin.id, outcome, note);
  return ok();
});
