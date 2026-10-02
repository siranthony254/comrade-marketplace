// src/app/(dashboard)/layout.tsx — shell for /seller/* and /buyer/*.
// Reads the user from the DB on every request (never trusts the token for status).

import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const name = user.studentProfile?.fullName ?? user.email;
  return (
    <DashboardShell user={{ name, role: user.role, status: user.status, phoneVerified: !!user.phoneVerifiedAt }}>
      {children}
    </DashboardShell>
  );
}
