// src/lib/session.ts
// Server-side guards. Pages use require*(), which redirect; API routes use api*(), which throw ApiError.
// All of them read the account from the DB so status changes apply immediately.

import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: { include: { school: true, business: true } } },
  });
  if (!user || user.status === "SUSPENDED" || user.status === "REJECTED") return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ── Pages ────────────────────────────────────────────────────────
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT" || !user.studentProfile) redirect("/login");
  return { user, profile: user.studentProfile };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

// ── API routes ───────────────────────────────────────────────────
export async function apiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  return user;
}

/** A student whose ID has been approved. Buying, selling and listing all require this. */
export async function apiActiveStudent() {
  const user = await apiUser();
  if (user.role !== "STUDENT" || !user.studentProfile) throw new ApiError(403, "Student account required.");
  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your student ID is still being reviewed. You'll be able to do this as soon as it's approved.");
  }
  return { user, profile: user.studentProfile };
}

export async function apiAdmin(): Promise<CurrentUser> {
  const user = await apiUser();
  if (user.role !== "ADMIN") throw new ApiError(403, "Admins only.");
  return user;
}
