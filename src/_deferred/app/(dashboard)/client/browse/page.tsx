// DEFERRED (Phase 3) — Route: /client/browse
// TODO: GET /api/marketplace/services?type=SERVICE&q=&category=. Show student business pages for service providers. External clients pay 8-10% fee at checkout.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Browse Student Talent</h1>
        <p className="text-sm text-muted-foreground">Discover student service providers: designers, writers, photographers, developers, marketers</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/marketplace/services?type=SERVICE&q=&category=. Show student business pages for service providers. External clients pay 8-10% fee at checkout.</p>
      </div>
    </div>
  );
}
