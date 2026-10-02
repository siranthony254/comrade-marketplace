// Route: /seller/wholesale
// Browse verified suppliers, place individual or group orders, track wholesale order status
// TODO: GET /api/suppliers/catalogue. Group order: POST /api/wholesale/group-orders. Individual: POST /api/wholesale/orders. Escrow same flow as peer orders.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Wholesale Suppliers</h1>
        <p className="text-sm text-muted-foreground">Browse verified suppliers, place individual or group orders, track wholesale order status</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/suppliers/catalogue. Group order: POST /api/wholesale/group-orders. Individual: POST /api/wholesale/orders. Escrow same flow as peer orders.</p>
      </div>
    </div>
  );
}
