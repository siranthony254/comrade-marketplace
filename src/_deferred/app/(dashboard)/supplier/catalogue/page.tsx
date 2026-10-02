// DEFERRED (Phase 3) — Route: /supplier/catalogue
// TODO: GET /api/supplier/catalogue. POST /api/supplier/products. Price lock enforced server-side: priceLockUntil = now + 30days on create. PATCH /api/supplier/products/:id/request-price-update for changes.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Catalogue</h1>
        <p className="text-sm text-muted-foreground">Add, edit, and manage wholesale product listings. Set pricing tiers, MOQ, lead times.</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/supplier/catalogue. POST /api/supplier/products. Price lock enforced server-side: priceLockUntil = now + 30days on create. PATCH /api/supplier/products/:id/request-price-update for changes.</p>
      </div>
    </div>
  );
}
