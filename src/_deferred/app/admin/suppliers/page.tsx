// Route: /admin/suppliers
// All suppliers, their reliability scores, strike history, subscription status, and tier
// TODO: GET /api/admin/suppliers. Issue strikes: POST /api/admin/suppliers/:id/strikes. Suspend: PATCH /api/admin/suppliers/:id/suspend. View full reliability score breakdown.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Supplier Management</h1>
        <p className="text-sm text-muted-foreground">All suppliers, their reliability scores, strike history, subscription status, and tier</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/admin/suppliers. Issue strikes: POST /api/admin/suppliers/:id/strikes. Suspend: PATCH /api/admin/suppliers/:id/suspend. View full reliability score breakdown.</p>
      </div>
    </div>
  );
}
