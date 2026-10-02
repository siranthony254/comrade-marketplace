// src/app/admin/layout.tsx — admin shell. requireAdmin() is the real check; middleware is only the first gate.

import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <DashboardShell user={{ name: admin.email, role: "ADMIN", status: admin.status }}>{children}</DashboardShell>;
}
