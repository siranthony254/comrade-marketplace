// /account/phone — self-service, optional, any time after signup. Never a gate on using the platform.

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { VerifyPhoneForm } from "./VerifyPhoneForm";

export const metadata: Metadata = { title: "Verify your phone" };
export const dynamic = "force-dynamic";

export default async function VerifyPhonePage() {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <nav className="h-14 flex items-center px-6 border-b border-border bg-background">
        <Link href="/" className="font-display font-bold text-lg text-primary">Comrade<span className="text-secondary">Market</span></Link>
      </nav>
      <main className="flex-1 flex items-center justify-center p-4">
        <VerifyPhoneForm phone={`0${user.phone.slice(3)}`} alreadyVerified={!!user.phoneVerifiedAt} />
      </main>
    </div>
  );
}
