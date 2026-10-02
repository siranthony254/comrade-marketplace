import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell title="About Comrade Market">
      <p>Students bring money into campus from HELB, parents and part-time work — and most of it leaves again, spent off campus. Comrade Market keeps more of it circulating among comrades.</p>
      <p>You buy from a fellow student who makes a profit. Later, they buy something you sell. Each shilling does more work before it leaves.</p>
      <p>It&apos;s a free, community-first project: every student can open a professional storefront at no cost, and escrow protects both sides so nobody gets scammed for their work.</p>
    </PageShell>
  );
}
