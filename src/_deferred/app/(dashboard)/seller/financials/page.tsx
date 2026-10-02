// src/app/(dashboard)/seller/financials/page.tsx
// FINANCIAL SUITE — P&L, expense logger, invoice generator, revenue calendar
// Route: /seller/financials

"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, FileText, Plus, Download, Receipt } from "lucide-react";

type Period = "week" | "month" | "quarter";

// TODO: Fetch from GET /api/seller/financials?period=
const MOCK_PL: Record<Period, { revenue: number; cogs: number; expenses: number }> = {
  week:    { revenue: 4200,  cogs: 1800,  expenses: 300  },
  month:   { revenue: 18750, cogs: 8200,  expenses: 1200 },
  quarter: { revenue: 54000, cogs: 24000, expenses: 3800 },
};

const MOCK_EXPENSES = [
  { id: "1", date: "2024-07-15", description: "Gas (cooking)", amount: 500, category: "Operations" },
  { id: "2", date: "2024-07-14", description: "Packaging bags x100", amount: 250, category: "Packaging" },
  { id: "3", date: "2024-07-13", description: "Data bundle (business)", amount: 200, category: "Communication" },
  { id: "4", date: "2024-07-12", description: "Ingredients — weekly stock", amount: 2800, category: "Stock" },
];

const MOCK_INVOICES = [
  { id: "INV-001", client: "Mike Kamau", amount: 800, status: "PAID", date: "2024-07-14" },
  { id: "INV-002", client: "Starehe Hostel Events", amount: 3500, status: "PENDING", date: "2024-07-10" },
];

export default function SellerFinancialsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [activeTab, setActiveTab] = useState<"pl" | "expenses" | "invoices">("pl");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const pl = MOCK_PL[period];
  const grossProfit = pl.revenue - pl.cogs;
  const netProfit = grossProfit - pl.expenses;
  const profitMargin = Math.round((netProfit / pl.revenue) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Financials</h1>
          <p className="text-sm text-muted-foreground">Your business money, clearly</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(["week", "month", "quarter"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                ${period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "This Quarter"}
            </button>
          ))}
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: pl.revenue, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Cost of Goods", value: pl.cogs, icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Gross Profit", value: grossProfit, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Net Profit", value: netProfit, icon: TrendingUp, color: "text-primary", bg: "bg-accent" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="font-display font-bold text-lg">KES {s.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profit margin bar */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium">Profit Margin</span>
          <span className={`font-bold ${profitMargin > 20 ? "text-green-600" : profitMargin > 10 ? "text-amber-600" : "text-red-600"}`}>
            {profitMargin}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${profitMargin > 20 ? "bg-green-500" : profitMargin > 10 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(profitMargin, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {profitMargin > 30 ? "🔥 Excellent margin! Keep it up." : profitMargin > 15 ? "✅ Healthy margin." : "⚠️ Margin is low. Review your costs."}
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["pl", "expenses", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px transition-colors capitalize
              ${activeTab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "pl" ? "P&L Statement" : t === "expenses" ? "Expenses" : "Invoices"}
          </button>
        ))}
      </div>

      {/* P&L Table */}
      {activeTab === "pl" && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Profit & Loss Statement</h3>
            <button className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <Download className="w-3.5 h-3.5" /> Download PDF
              {/* TODO: Generate PDF using jspdf */}
            </button>
          </div>
          <div className="space-y-2">
            {[
              { label: "Total Revenue", value: pl.revenue, bold: false, color: "" },
              { label: "Cost of Goods Sold", value: -pl.cogs, bold: false, color: "text-red-600" },
              { label: "Gross Profit", value: grossProfit, bold: true, color: "" },
              { label: "Operating Expenses", value: -pl.expenses, bold: false, color: "text-red-600" },
              { label: "NET PROFIT", value: netProfit, bold: true, color: netProfit >= 0 ? "text-primary" : "text-red-600" },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex justify-between py-2 text-sm ${row.bold ? "font-bold border-t border-border" : ""}`}
              >
                <span>{row.label}</span>
                <span className={row.color}>
                  KES {Math.abs(row.value).toLocaleString()}
                  {row.value < 0 ? " (expense)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowExpenseForm(true)}
            className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>

          {MOCK_EXPENSES.map((e) => (
            <div key={e.id} className="stat-card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{e.description}</p>
                <p className="text-xs text-muted-foreground">{e.category} · {e.date}</p>
              </div>
              <span className="font-semibold text-red-600">- KES {e.amount.toLocaleString()}</span>
            </div>
          ))}

          {/* Expense Form Modal */}
          {showExpenseForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h3 className="font-display text-lg font-bold mb-4">Log Expense</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Description</label>
                    <input type="text" placeholder="e.g. Gas for cooking" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Amount (KES)</label>
                      <input type="number" placeholder="500" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Category</label>
                      <select className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        {["Stock", "Packaging", "Transport", "Communication", "Marketing", "Operations", "Other"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Date</label>
                    <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowExpenseForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">Save Expense</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvoiceForm(true)}
              className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FileText className="w-4 h-4" /> New Invoice
            </button>
            <button className="flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors">
              <Receipt className="w-4 h-4" /> New Receipt
            </button>
          </div>

          {MOCK_INVOICES.map((inv) => (
            <div key={inv.id} className="stat-card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inv.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {inv.status}
                  </span>
                </div>
                <p className="font-medium text-sm mt-0.5">{inv.client}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">KES {inv.amount.toLocaleString()}</span>
                <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  {/* TODO: Generate and download PDF invoice */}
                </button>
              </div>
            </div>
          ))}

          {/* Invoice Form Modal */}
          {showInvoiceForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h3 className="font-display text-lg font-bold mb-4">Create Invoice</h3>
                <div className="space-y-3">
                  {[
                    { label: "Client Name", placeholder: "Mike Kamau" },
                    { label: "Client Email (optional)", placeholder: "mike@email.com" },
                    { label: "Client Phone", placeholder: "0712345678" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-sm font-medium block mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Item Description</label>
                    <input type="text" placeholder="Custom birthday cake" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Amount (KES)</label>
                      <input type="number" placeholder="800" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Due Date</label>
                      <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowInvoiceForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Generate Invoice
                    {/* TODO: POST /api/seller/invoices → generate PDF → return download URL */}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
