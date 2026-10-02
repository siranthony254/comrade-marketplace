// DEFERRED (Phase 3) — Route: /supplier/analytics
// TODO: GET /api/supplier/analytics. Charts via recharts: LineChart for revenue over time, BarChart for orders by campus, PieChart for product categories.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Order volume by campus, top products, reliability score breakdown, revenue trends</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/supplier/analytics. Charts via recharts: LineChart for revenue over time, BarChart for orders by campus, PieChart for product categories.</p>
      </div>
    </div>
  );
}
