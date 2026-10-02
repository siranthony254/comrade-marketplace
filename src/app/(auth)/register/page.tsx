// /register — student signup. Server component loads the school list; the form is a client component.

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Join free" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const schools = await prisma.school.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true },
  });
  return <RegisterForm schools={schools} />;
}
