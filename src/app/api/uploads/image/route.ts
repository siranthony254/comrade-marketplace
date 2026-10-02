// POST /api/uploads/image  (multipart, field "file")
// Authenticated upload for PUBLIC images: business logo/banner and product photos.

import { handle, ok, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { savePublicImage } from "@/lib/storage";

export const POST = handle(async (req) => {
  await apiActiveStudent();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No file uploaded.");
  const kind = form.get("kind");
  const url = await savePublicImage(Buffer.from(await file.arrayBuffer()), kind === "banner" ? 1600 : 1000);
  return ok({ url });
});
