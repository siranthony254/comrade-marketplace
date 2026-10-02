// /explore — public discovery (works signed out; ordering asks you to sign in).

import type { Metadata } from "next";
import Link from "next/link";
import { ExploreView } from "@/components/ExploreView";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Browse student businesses" };
export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: { q?: string; category?: string; schoolId?: string } }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border">
        <Link href="/" className="font-display font-bold text-lg text-primary">Comrade<span className="text-secondary">Market</span></Link>
        <Link href={user ? "/post-login" : "/login"} className="text-sm font-medium text-primary">{user ? "My dashboard" : "Sign in"}</Link>
      </nav>
      <div className="px-4 py-8"><ExploreView action="/explore" searchParams={searchParams} /></div>
    </div>
  );
}
