// DEFERRED (Phase 3) — Route: /supplier/services
// TODO: GET /api/service-briefs?postedBy=supplier. POST /api/service-briefs. GET /api/service-briefs/:id/bids. POST /api/service-briefs/:id/award/:bidId.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hire Comrade Services</h1>
        <p className="text-sm text-muted-foreground">Post briefs for student services: design, photography, writing, campus influencing. Review bids, award, escrow protects both.</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/service-briefs?postedBy=supplier. POST /api/service-briefs. GET /api/service-briefs/:id/bids. POST /api/service-briefs/:id/award/:bidId.</p>
      </div>
    </div>
  );
}
