// DEFERRED (Phase 3) — Route: /supplier/influencers
// TODO: GET /api/influencers?campus=&niche=. Filter by school, category. POST /api/influencer-campaigns. Escrow holds campaign budget. Release after supplier confirms post.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Campus Influencers</h1>
        <p className="text-sm text-muted-foreground">Browse verified student influencers by campus, niche, and follower count. Commission campaigns with escrow protection.</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/influencers?campus=&niche=. Filter by school, category. POST /api/influencer-campaigns. Escrow holds campaign budget. Release after supplier confirms post.</p>
      </div>
    </div>
  );
}
