// /post-login — sends a freshly signed-in user to the right home.

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostLogin() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  redirect(user.studentProfile?.business ? "/seller" : "/buyer/discover");
}
