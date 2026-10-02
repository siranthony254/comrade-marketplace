// DEFERRED (Phase 3) — Route: /client/post-brief
// TODO: POST /api/service-briefs with externalClientId. Category, description, budget, deadline, attachments. GET /api/service-briefs/:id/bids for incoming proposals.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Post a Brief</h1>
        <p className="text-sm text-muted-foreground">Describe what you need, set budget and deadline. Students bid, you choose the best.</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: POST /api/service-briefs with externalClientId. Category, description, budget, deadline, attachments. GET /api/service-briefs/:id/bids for incoming proposals.</p>
      </div>
    </div>
  );
}
