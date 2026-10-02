// GET   /api/notifications — latest 15 + unread count for the signed-in user
// PATCH /api/notifications — mark all read

import { handle, ok } from "@/lib/api";
import { apiUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const GET = handle(async () => {
  const user = await apiUser();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return ok({ unread, items });
});

export const PATCH = handle(async () => {
  const user = await apiUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return ok();
});
